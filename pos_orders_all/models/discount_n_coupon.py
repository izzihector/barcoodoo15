# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.
import logging
from datetime import timedelta
from functools import partial

import psycopg2
import pytz

from odoo import api, fields, models, tools, _
from odoo.tools import float_is_zero
from odoo.exceptions import UserError
from odoo.http import request
import odoo.addons.decimal_precision as dp
from odoo.osv.expression import AND

_logger = logging.getLogger(__name__)


class PosOrder(models.Model):
	_inherit = 'pos.order'

	discount_type = fields.Char(string='Discount Type')
	coupon_id = fields.Many2one('pos.gift.coupon')

	def _prepare_invoice_line(self, order_line):
		res = super(PosOrder, self)._prepare_invoice_line(order_line)
		res.update({
			'pos_order_line_id' : order_line.id,
			'pos_order_id' : self.id
			})
		return res

	def _prepare_invoice_vals(self):
		res = super(PosOrder, self)._prepare_invoice_vals()
		res.update({
			'pos_order_id' : self.id,
		})
		return res

	@api.model
	def _amount_line_tax(self, line, fiscal_position_id):
		taxes = line.tax_ids.filtered(lambda t: t.company_id.id == line.order_id.company_id.id)
		if fiscal_position_id:
			taxes = fiscal_position_id.map_tax(taxes, line.product_id, line.order_id.partner_id)
		if line.discount_line_type == 'Percentage':
			price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
		else:
			price = line.price_unit - line.discount
		taxes = taxes.compute_all(price, line.order_id.pricelist_id.currency_id, line.qty, product=line.product_id, partner=line.order_id.partner_id or False)['taxes']
		return sum(tax.get('amount', 0.0) for tax in taxes)


	@api.onchange('payment_ids', 'lines')
	def _onchange_amount_all(self):
		for order in self:
			currency = order.pricelist_id.currency_id
			order.amount_paid = sum(payment.amount for payment in order.payment_ids)
			order.amount_return = sum(payment.amount < 0 and payment.amount or 0 for payment in order.payment_ids)
			order.amount_tax = currency.round(sum(self._amount_line_tax(line, order.fiscal_position_id) for line in order.lines))
			amount_untaxed = currency.round(sum(line.price_subtotal for line in order.lines))
			order.amount_total = order.amount_tax + amount_untaxed


	@api.model
	def _process_order(self, order, draft, existing_order):
		"""Create or update an pos.order from a given dictionary.

		:param dict order: dictionary representing the order.
		:param bool draft: Indicate that the pos_order is not validated yet.
		:param existing_order: order to be updated or False.
		:type existing_order: pos.order.
		:returns: id of created/updated pos.order
		:rtype: int
		"""
		order = order['data']
		pos_session = self.env['pos.session'].browse(order['pos_session_id'])
		if pos_session.state == 'closing_control' or pos_session.state == 'closed':
			order['pos_session_id'] = self._get_valid_session(order).id

		pos_order = False
		if not existing_order:
			pos_order = self.create(self._order_fields(order))
		else:
			pos_order = existing_order
			pos_order.lines.unlink()
			order['user_id'] = pos_order.user_id.id
			pos_order.write(self._order_fields(order))

		coupon_id = order.get('coupon_id', False)
		if coupon_id:
			coup_max_amount = order.get('coup_maxamount',False)
			pos_order.write({'coupon_id':  coupon_id})
			pos_order.coupon_id.update({
				'coupon_count': pos_order.coupon_id.coupon_count + 1,
				'max_amount': coup_max_amount
			})

		if pos_order.config_id.discount_type == 'percentage':
			pos_order.update({'discount_type': "Percentage"})
			pos_order.lines.update({'discount_line_type': "Percentage"})
		if pos_order.config_id.discount_type == 'fixed':
			pos_order.update({'discount_type': "Fixed"})
			pos_order.lines.update({'discount_line_type': "Fixed"})

		pos_order = pos_order.with_company(pos_order.company_id)
		self = self.with_company(pos_order.company_id)
		self._process_payment_lines(order, pos_order, pos_session, draft)

		if not draft:
			try:
				pos_order.action_pos_order_paid()
			except psycopg2.DatabaseError:
				# do not hide transactional errors, the order(s) won't be saved!
				raise
			except Exception as e:
				_logger.error('Could not fully process the POS Order: %s', tools.ustr(e))

		pos_order._create_order_picking()

		create_invoice = False
		if pos_order.to_invoice and pos_order.state == 'paid':
			if pos_order.amount_total > 0:	
				create_invoice = True
			elif pos_order.amount_total < 0:
				if pos_order.session_id.config_id.credit_note == "create_note":
					create_invoice = True

		if create_invoice:
			pos_order.action_pos_order_invoice()
			if pos_order.discount_type and pos_order.discount_type == "Fixed":
				invoice = pos_order.account_move
				for line in invoice.invoice_line_ids : 
					pos_line = line.pos_order_line_id
					if pos_line and pos_line.discount_line_type == "Fixed":
						line.write({'price_unit':pos_line.price_unit})

		return pos_order.id

	
class PosOrderLine(models.Model):
	_inherit = 'pos.order.line'

	discount_line_type = fields.Char(string='Discount Type',readonly=True)

	def _compute_amount_line_all(self):
		self.ensure_one()
		fpos = self.order_id.fiscal_position_id
		tax_ids_after_fiscal_position = fpos.map_tax(self.tax_ids, self.product_id, self.order_id.partner_id) if fpos else self.tax_ids
		
		if self.discount_line_type == "Fixed":
			price = self.price_unit - self.discount
		else:
			price = self.price_unit * (1 - (self.discount or 0.0) / 100.0)

		taxes = tax_ids_after_fiscal_position.compute_all(price, self.order_id.pricelist_id.currency_id, self.qty, product=self.product_id, partner=self.order_id.partner_id)
		return {
			'price_subtotal_incl': taxes['total_included'],
			'price_subtotal': taxes['total_excluded'],
		}


class PosSession(models.Model):
	_inherit = "pos.session"

	def _prepare_line(self, order_line):
		""" Derive from order_line the order date, income account, amount and taxes information.

		These information will be used in accumulating the amounts for sales and tax lines.
		"""
		def get_income_account(order_line):
			product = order_line.product_id
			income_account = product.with_company(order_line.company_id)._get_product_accounts()['income']
			if not income_account:
				raise UserError(_('Please define income account for this product: "%s" (id:%d).')
								% (product.name, product.id))
			return order_line.order_id.fiscal_position_id.map_account(income_account)

		tax_ids = order_line.tax_ids_after_fiscal_position\
					.filtered(lambda t: t.company_id.id == order_line.order_id.company_id.id)
		sign = -1 if order_line.qty >= 0 else 1
		price = sign * order_line.price_unit * (1 - (order_line.discount or 0.0) / 100.0)
		if order_line.discount_line_type != 'Percentage':
			price = sign * order_line.price_unit * (1 - (order_line.discount or 0.0) / 100.0)
		
		# The 'is_refund' parameter is used to compute the tax tags. Ultimately, the tags are part
		# of the key used for summing taxes. Since the POS UI doesn't support the tags, inconsistencies
		# may arise in 'Round Globally'.
		check_refund = lambda x: x.qty * x.price_unit < 0
		if self.company_id.tax_calculation_rounding_method == 'round_globally':
			is_refund = all(check_refund(line) for line in order_line.order_id.lines)
		else:
			is_refund = check_refund(order_line)
		tax_data = tax_ids.compute_all(price_unit=price, quantity=abs(order_line.qty), currency=self.currency_id, is_refund=is_refund)
		taxes = tax_data['taxes']
		# For Cash based taxes, use the account from the repartition line immediately as it has been paid already
		for tax in taxes:
			tax_rep = self.env['account.tax.repartition.line'].browse(tax['tax_repartition_line_id'])
			tax['account_id'] = tax_rep.account_id.id
		date_order = order_line.order_id.date_order
		taxes = [{'date_order': date_order, **tax} for tax in taxes]
		return {
			'date_order': order_line.order_id.date_order,
			'income_account_id': get_income_account(order_line).id,
			'amount': order_line.price_subtotal,
			'taxes': taxes,
			'base_tags': tuple(tax_data['base_tags']),
		}
	

class ReportSaleDetailsInherit(models.AbstractModel):

	_inherit = 'report.point_of_sale.report_saledetails'

	@api.model
	def get_sale_details(self, date_start=False, date_stop=False, config_ids=False, session_ids=False):
		""" Serialise the orders of the requested time period, configs and sessions.

		:param date_start: The dateTime to start, default today 00:00:00.
		:type date_start: str.
		:param date_stop: The dateTime to stop, default date_start + 23:59:59.
		:type date_stop: str.
		:param config_ids: Pos Config id's to include.
		:type config_ids: list of numbers.
		:param session_ids: Pos Config id's to include.
		:type session_ids: list of numbers.

		:returns: dict -- Serialised sales.
		"""

		domain = [('state', 'in', ['paid','invoiced','done'])]

		if (session_ids):
			domain = AND([domain, [('session_id', 'in', session_ids)]])
		else:
			if date_start:
				date_start = fields.Datetime.from_string(date_start)
			else:
				# start by default today 00:00:00
				user_tz = pytz.timezone(self.env.context.get('tz') or self.env.user.tz or 'UTC')
				today = user_tz.localize(fields.Datetime.from_string(fields.Date.context_today(self)))
				date_start = today.astimezone(pytz.timezone('UTC'))

			if date_stop:
				date_stop = fields.Datetime.from_string(date_stop)
				# avoid a date_stop smaller than date_start
				if (date_stop < date_start):
					date_stop = date_start + timedelta(days=1, seconds=-1)
			else:
				# stop by default today 23:59:59
				date_stop = date_start + timedelta(days=1, seconds=-1)

			domain = AND([domain,
				[('date_order', '>=', fields.Datetime.to_string(date_start)),
				('date_order', '<=', fields.Datetime.to_string(date_stop))]
			])

			if config_ids:
				domain = AND([domain, [('config_id', 'in', config_ids)]])

		orders = self.env['pos.order'].search(domain)

		user_currency = self.env.company.currency_id

		total = 0.0
		products_sold = {}
		taxes = {}
		for order in orders:
			if user_currency != order.pricelist_id.currency_id:
				total += order.pricelist_id.currency_id._convert(
					order.amount_total, user_currency, order.company_id, order.date_order or fields.Date.today())
			else:
				total += order.amount_total
			currency = order.session_id.currency_id

			for line in order.lines:
				key = (line.product_id, line.price_unit, line.discount,line.discount_line_type)
				products_sold.setdefault(key, 0.0)
				products_sold[key] += line.qty

				if line.tax_ids_after_fiscal_position:
					line_taxes = line.tax_ids_after_fiscal_position.compute_all(line.price_unit * (1-(line.discount or 0.0)/100.0), currency, line.qty, product=line.product_id, partner=line.order_id.partner_id or False)
					for tax in line_taxes['taxes']:
						taxes.setdefault(tax['id'], {'name': tax['name'], 'tax_amount':0.0, 'base_amount':0.0})
						taxes[tax['id']]['tax_amount'] += tax['amount']
						taxes[tax['id']]['base_amount'] += tax['base']
				else:
					taxes.setdefault(0, {'name': _('No Taxes'), 'tax_amount':0.0, 'base_amount':0.0})
					taxes[0]['base_amount'] += line.price_subtotal_incl

		payment_ids = self.env["pos.payment"].search([('pos_order_id', 'in', orders.ids)]).ids
		if payment_ids:
			self.env.cr.execute("""
				SELECT method.name, sum(amount) total
				FROM pos_payment AS payment,
					 pos_payment_method AS method
				WHERE payment.payment_method_id = method.id
					AND payment.id IN %s
				GROUP BY method.name
			""", (tuple(payment_ids),))
			payments = self.env.cr.dictfetchall()
		else:
			payments = []

		return {
			'currency_precision': user_currency.decimal_places,
			'total_paid': user_currency.round(total),
			'payments': payments,
			'company_name': self.env.user.company_id.name,
			'taxes': list(taxes.values()),
			'products': sorted([{
				'product_id': product.id,
				'product_name': product.name,
				'code': product.default_code,
				'quantity': qty,
				'discount_line_type': discount_line_type,
				'price_unit': price_unit,
				'discount': discount,
				'uom': product.uom_id.name
			} for (product, price_unit, discount,discount_line_type), qty in products_sold.items()], key=lambda l: l['product_name'])
		}


# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:    
