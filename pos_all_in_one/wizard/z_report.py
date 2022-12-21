# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

import logging
from datetime import timedelta,date,datetime
from functools import partial

import psycopg2
import pytz

from odoo import api, fields, models, tools, _
from odoo.tools import float_is_zero
from odoo.exceptions import UserError
from odoo.http import request
from odoo.addons import decimal_precision as dp

_logger = logging.getLogger(__name__)

class PosZReport(models.TransientModel):

	_name='z.report.wizard'
	_description = "POS Z Report Wizard"

	pos_session_ids = fields.Many2many('pos.session', 'pos_sessions_close',string="POS Session(s)",domain="[('state', 'in', ['closed'])]",required=True)
	report_type = fields.Char('Report Type', readonly = True, default='PDF')
	company_id = fields.Many2one('res.company',"Company")

	def generate_z_report(self):
		data = {'session_ids':self.pos_session_ids.ids,
				'company':self.company_id.id}
		return self.env.ref('pos_all_in_one.action_z_report_print').report_action([], data=data)


class ClosedSessionReport(models.AbstractModel):

	_name = 'report.pos_all_in_one.report_closed_session'
	_description = 'Closed Session Point of Sale Details'

	@api.model
	def get_sale_details(self,sessions=False,company=False):
		if sessions:
			orders = self.env['pos.order'].search([
				('session_id.state','in', ['closed']),
				('session_id', 'in', sessions.ids)])

		user_currency = self.env.user.company_id.currency_id

		total = 0.0
		products_sold = {}
		total_tax = 0.0
		taxes = {}
		mypro = {}
		products = []
		categories_data = {}
		total_discount = 0.0
		return_total =0.0
		categories_tot = []
		
		for order in orders:
			if user_currency != order.pricelist_id.currency_id:
				total += order.pricelist_id.currency_id._convert(
					order.amount_total, user_currency, order.company_id, order.date_order or fields.Date.today())
			else:
				total += order.amount_total
			currency = order.session_id.currency_id

			total_tax = total_tax + order.amount_tax
			for line in order.payment_ids:
				if line.name:
					if 'return' in line.name:
						return_total+= abs(line.amount)

			for line in order.lines:
				total_discount +=line.qty * line.price_unit - line.price_subtotal

				category = line.product_id.pos_categ_id.name
				if category in categories_data:
					old_subtotal = categories_data[category]['total']
					categories_data[category].update({
					'total' : old_subtotal+line.price_subtotal_incl,
					})
				else:
					categories_data.update({ category : {
						'name' :category,
						'total' : line.price_subtotal_incl,
					}})

			categories_tot = list(categories_data.values())		
		st_line_ids = self.env["pos.payment"].search([('pos_order_id', 'in', orders.ids)]).ids
		if st_line_ids:
			self.env.cr.execute("""
				SELECT ppm.name, sum(amount) total
				FROM pos_payment AS pp,
					pos_payment_method AS ppm
				WHERE  pp.payment_method_id = ppm.id 
					AND pp.id IN %s 
				GROUP BY ppm.name
			""", (tuple(st_line_ids),))
			payments = self.env.cr.dictfetchall()
		else:
			payments = []

		sessions_name =[]
		opening_balance = 0.0
		clsoing_balance =0.0
		control_diff = 0.0
		for i in sessions:
			if i.cash_register_balance_start:
				opening_balance += i.cash_register_balance_start
				clsoing_balance += i.cash_register_balance_end_real
				control_diff += i.cash_register_difference
			sessions_name.append(i.name)

		num_sessions = ', '.join(map(str,sessions_name) )

		return {
			'currency_precision': 2,
			'total_paid': user_currency.round(total),
			'payments': payments,
			'company_name': self.env.user.company_id.name,
			'taxes': float(total_tax),
			'num_sessions': num_sessions,			
			'categories_data':categories_tot,
			'total_discount' : total_discount,
			'print_date' : datetime.now(),
			'return_total':return_total,
			'opening_balance':opening_balance,
			'clsoing_balance':clsoing_balance,
			'control_diff':control_diff,
			'company':company,
		}

	def _get_report_values(self, docids, data=None):
		data = dict(data or {})
		sessions = self.env['pos.session'].browse(data['session_ids'])
		company = self.env['res.company'].browse(data['company'])
		data.update(self.get_sale_details(sessions,company))
		return data
