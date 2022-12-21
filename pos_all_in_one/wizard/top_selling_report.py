# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from datetime import datetime,timedelta
from dateutil.relativedelta import relativedelta
from odoo import api, fields, models, _
from odoo.exceptions import Warning
import itertools

class TopSellingReport(models.AbstractModel):

	_name='report.pos_all_in_one.report_top_selling'
	_description = "POS Top Selling Report"

	def _get_report_values(self, docids, data=None,sessions=False):

		Report = self.env['ir.actions.report']
		top_selling_report = Report._get_report_from_name('pos_membership_odoo.report_top_selling')		
		top_selling_rec = self.env['pos.top.selling.wizard'].browse(docids)	
		orders = self.env['pos.order'].search([
				('date_order', '>=', top_selling_rec.start_dt),
				('date_order', '<=', top_selling_rec.end_dt),
				('state', 'in', ['paid','invoiced','done']),
			])	
		top_list={}	

		if top_selling_rec.top_selling == 'products':
			prod_data ={}	
			for odr in orders:		
				for line in odr.lines:					
					product = line.product_id.id
					if product in prod_data:
						old_qty = prod_data[product]['qty']
						prod_data[product].update({
							'qty' :  float(old_qty+line.qty),
						})
					else:	
						prod_data.update({ product : {
							'product_id':line.product_id.id,
							'product_name':line.product_id.name,
							'uom_name':line.product_id.uom_id.name,
							'qty' : float(line.qty),							
						}})
					
			if 	top_selling_rec.no_product:				
				top_list=(sorted(prod_data.values(), key=lambda kv: kv['qty'], reverse=True)[:top_selling_rec.no_product])
			else:
				top_list=(sorted(prod_data.values(), key=lambda kv: kv['qty'], reverse=True))
		
		elif top_selling_rec.top_selling == 'categories':
			user_currency = self.env.user.company_id.currency_id
			categories_data = {}
			total = 0.0
			for order in orders:
				if user_currency != order.pricelist_id.currency_id:
					total += order.pricelist_id.currency_id._convert(
						order.amount_total, user_currency, order.company_id, order.date_order or fields.Date.today())
				else:
					total += order.amount_total
				currency = order.session_id.currency_id

				for line in order.lines:
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
				top_list = list(categories_data.values())

		else:
			prod_data ={}
			if sessions:
				orders = self.env['pos.order'].search([
					('session_id.state','in', ['closed']),
					('session_id', 'in', sessions.ids)])				
			for odr in orders:									
				customer = odr.partner_id.id
				if customer in prod_data:
					old_amount = prod_data[customer]['amount_paid']
					prod_data[customer].update({
						'amount_paid' :  float(old_amount+odr.amount_paid),
					})
				else:	
					prod_data.update({ customer : {
						'partner_id':odr.partner_id.name,
						'amount_paid':odr.amount_paid
						
					}})
				
			if 	top_selling_rec.no_product:				
				top_list=(sorted(prod_data.values(), key=lambda kv: kv['amount_paid'], reverse=True)[:top_selling_rec.no_product])
			else:
				top_list=(sorted(prod_data.values(), key=lambda kv: kv['amount_paid'], reverse=True))
			
		return {
			'currency_precision': 2,
			'doc_ids': docids,
			'doc_model': 'pos.top.selling.wizard',
			'start_dt' : top_selling_rec.start_dt,
			'end_dt' : top_selling_rec.end_dt,
			'prod_data':top_list,
			'top_selling':top_selling_rec.top_selling,			
		}
	

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
