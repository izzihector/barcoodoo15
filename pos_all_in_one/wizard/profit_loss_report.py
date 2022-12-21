# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from datetime import datetime,timedelta
from dateutil.relativedelta import relativedelta
from odoo import api, fields, models, _
from odoo.exceptions import Warning
import itertools

class ProfitLossReport(models.AbstractModel):

	_name='report.pos_all_in_one.report_profit_loss'	
	_description = "POS Profit Loss Report"

	def _get_report_values(self, docids, data=None,sessions=False):

		Report = self.env['ir.actions.report']
		top_selling_rec = self.env['pos.profit.loss.wizard'].browse(docids)	
		orders = self.env['pos.order'].search([
				('date_order', '>=', top_selling_rec.start_dt),
				('date_order', '<=', top_selling_rec.end_dt),
				('state', 'in', ['paid','invoiced','done']),
			])			
		prod_data ={}
		top_list={}
		my_prod = {}			
		for odr in orders:		
			for line in odr.lines:					
				product = line.product_id.id
				disc = 0
				if line.discount > 0 :
					disc =(line.price_unit * line.qty * line.discount)/100

				if product in prod_data:
					old_qty = prod_data[product]['qty']
					old_discount = prod_data[product]['discount']
					old_tax = prod_data[product]['taxes']
					old_price=prod_data[product]['price_subtotal']
					old_gross = prod_data[product]['gross_profit']
					prod_data[product].update({
						'qty' :  float(old_qty+line.qty),
						'price_subtotal': float(old_price+line.price_subtotal),
						'discount':float(old_discount+ disc),
						'taxes':float(old_tax + line.price_subtotal_incl - line.price_subtotal),
						'cost_price':line.product_id.standard_price * (float(old_qty+line.qty)),
						'gross_profit': float(old_gross + line.price_subtotal_incl-(line.product_id.standard_price * line.qty))
					})
				else:	
					prod_data.update({ product : {
						'product_id':line.product_id.id,
						'product_name':line.product_id.name,
						'uom_name':line.product_id.uom_id.name,
						'price_unit':line.price_unit,
						'discount': float(disc),
						'taxes':line.price_subtotal_incl - line.price_subtotal,
						'price_subtotal':line.price_subtotal,
						'cost_price':line.product_id.standard_price * line.qty,
						'gross_profit':line.price_subtotal_incl-(line.product_id.standard_price * line.qty),
						'qty' : float(line.qty),							
					}})
				if product in my_prod:
					my_prod[product] += line.qty

				else:
					my_prod.update({
						product : line.qty
						})
		top_list=(sorted(prod_data.values(), key=lambda kv: kv['qty'], reverse=True))			
		return {
			'currency_precision': 2,
			'doc_ids': docids,
			'doc_model': 'pos.top.selling.wizard',
			'start_dt' : top_selling_rec.start_dt,
			'end_dt' : top_selling_rec.end_dt,
			'prod_data':top_list,			
		}
	

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
