# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _, tools
from odoo.exceptions import RedirectWarning, UserError, ValidationError, Warning
import random
from datetime import date, datetime
import calendar
from collections import OrderedDict


class PosOrderForPaymentReport(models.Model):
	_name = "pos.report.payment"
	_description = "POS Report Payment"

	def get_crnt_ssn_payment_pos_order(self, smry, cshr, curr_session, is_current_session, pay_st_date, pay_ed_date):
		config_obj = self.env['pos.config'].search([])
		cur_session = False
		if is_current_session == True:
			if smry == 'Salespersons':
				cur_session = self.env['pos.session'].browse(curr_session)
				orders = self.env['pos.order'].search([
					('state', 'in', ['paid', 'invoiced', 'done']),
					('user_id', '=', cshr),
					('session_id', '=', curr_session),
					('config_id', 'in', config_obj.ids)])
			else:
				cur_session = self.env['pos.session'].browse(curr_session)
				orders = self.env['pos.order'].search([
					('state', 'in', ['paid', 'invoiced', 'done']),
					('session_id', '=', curr_session),
					('config_id', 'in', config_obj.ids),
				])
		else:
			if smry == 'Salespersons':
				orders = self.env['pos.order'].search([
					('state', 'in', ['paid', 'invoiced', 'done']),
					('user_id', '=', cshr),
					('date_order', '>=', pay_st_date + ' 00:00:00'),
					('date_order', '<=', pay_ed_date + ' 23:59:59'),
					('config_id', 'in', config_obj.ids)])
			else:
				orders = self.env['pos.order'].search([
					('state', 'in', ['paid', 'invoiced', 'done']),
					('date_order', '>=', pay_st_date + ' 00:00:00'),
					('date_order', '<=', pay_ed_date + ' 23:59:59'),
					('config_id', 'in', config_obj.ids),
				])
		if cur_session:
			st_line_ids = self.env["pos.payment"].search([('pos_order_id', 'in', orders.ids),('create_date','>=',cur_session.start_at)]).ids
		else:
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

		if cur_session:
			st_ids = self.env["pos.payment"].search([('pos_order_id', 'in', orders.ids),('create_date','>=',cur_session.start_at)])
		else:
			st_ids = self.env["pos.payment"].search([('pos_order_id', 'in', orders.ids)])
			
		journal_data = {}
		final_total = 0.0
		for line in st_ids:
			journal = line.payment_method_id.name
			month = line.payment_date.strftime('%B') + " " + str(line.payment_date.year)
			if month in journal_data.keys():
				for i in journal_data[month]:
					if journal in i:
						old_subtotal = i.get(journal)
						i.update({
							journal: old_subtotal + line.amount,
						})
						final_total += line.amount
				if not any(journal in d for d in journal_data[month]):
					final_total += line.amount
					journal_data[month].append({
						journal: line.amount,
					})
			else:
				final_total += line.amount
				journal_data.update({month: [{
					journal: line.amount,
				}]})

		def get_month_from_key(item):
			months = {calendar.month_name[i]: i for i in range(1, 13)}
			# Convert '2015:November' to (2015, 11)
			# Return value of this function is used to compare dictionary keys.
			month, year = item[0].split(' ')  # item[0] is key
			return int(year), months.get(month, -1)

		final_jrnl = sorted(journal_data.items(), key=get_month_from_key, reverse=True)
		return [final_total, final_jrnl, payments]


class PosOrderForjournalReport(models.Model):
	_name = "pos.report.journal"
	_description = "POS Report Journal"

	def get_journal_pos_order(self, categ_st_date, categ_ed_date):
		config_obj = self.env['pos.config'].search([])
		pos_session_obj = self.env['pos.session'].search(
			[('start_at', '>=', categ_st_date + ' 00:00:00'), ('stop_at', '<=', categ_ed_date + ' 23:59:59')])

		orders = self.env['pos.order'].search([
			('date_order', '>=', categ_st_date + ' 00:00:00'),
			('date_order', '<=', categ_ed_date + ' 23:59:59'),
			('state', 'in', ['paid', 'invoiced', 'done']),
			('config_id', 'in', config_obj.ids)])

		product_ids = self.env["pos.order"].search([('id', 'in', orders.ids)]).ids

		if product_ids:
			self.env.cr.execute("""
				SELECT pc.name, sum(qty) total, sum(qty * price_unit)
				FROM pos_order_line AS pol,
					 pos_journal AS pc,
					 product_product AS product,
					 product_template AS templ
				WHERE pol.product_id = product.id
					AND templ.pos_categ_id = pc.id
					AND product.product_tmpl_id = templ.id
					AND pol.order_id IN %s 
				GROUP BY pc.name
				""", (tuple(product_ids),))
			categ = self.env.cr.dictfetchall()
		else:
			categ = []

		return categ


class PosOrderForCategoryReport(models.Model):
	_name = "pos.report.category"
	_description = "POS Report Category"

	def get_category_pos_order(self, categ_st_date, categ_ed_date, curr_session, categ_current_session):
		config_obj = self.env['pos.config'].search([])
		current_lang = self.env.context

		if categ_current_session == True:
			orders = self.env['pos.order'].search([
				('session_id', '=', curr_session),
				('state', 'in', ['paid', 'invoiced', 'done']),
				('config_id', 'in', config_obj.ids)])
		else:
			orders = self.env['pos.order'].search([
				('date_order', '>=', categ_st_date + ' 00:00:00'),
				('date_order', '<=', categ_ed_date + ' 23:59:59'),
				('state', 'in', ['paid', 'invoiced', 'done']),
				('config_id', 'in', config_obj.ids)])

		product_ids = self.env["pos.order"].search([('id', 'in', orders.ids)]).ids

		if product_ids:
			self.env.cr.execute("""
				SELECT pc.name, sum(qty) total, sum(price_subtotal_incl)
				FROM pos_order_line AS pol,
					 pos_category AS pc,
					 product_product AS product,
					 product_template AS templ
				WHERE pol.product_id = product.id
					AND templ.pos_categ_id = pc.id
					AND product.product_tmpl_id = templ.id
					AND pol.order_id IN %s 
				GROUP BY pc.name
				""", (tuple(product_ids),))
			categ = self.env.cr.dictfetchall()
		else:
			categ = []

		from deep_translator import GoogleTranslator

		if current_lang.get('lang') == 'es_ES':
			for ctg in categ:
				to_translate = ctg.get('name')
				translated = GoogleTranslator(source='english', target='spanish').translate(to_translate)
				ctg['name'] = translated
		return categ

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

