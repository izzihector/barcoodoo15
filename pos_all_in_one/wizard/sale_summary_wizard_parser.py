# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from datetime import datetime,timedelta
from dateutil.relativedelta import relativedelta
from odoo import api, fields, models, _
from odoo.exceptions import Warning

class SaleSummaryReport(models.AbstractModel):

	_name='report.pos_all_in_one.report_sales_summary'
	_description = "POS Sale Summary Report"
	

	def get_nested(data, *args):
			if args and data:
				element  = args[0]
				if element:
					value = data.get(element)
					return value if len(args) == 1 else get_nested(value, *args[1:])

	def _get_report_values(self, docids, data=None):

		Report = self.env['ir.actions.report']
		sale_summary_rec = self.env['pos.sale.summary.wizard'].browse(docids)		
		user_name = False		
		main_data_dict = {} 
		summery_data = []
		journal = []
		categ = []
		config_obj = self.env['pos.config'].search([])
		categories_data = {}
		categories_tot = []
		for u in sale_summary_rec.res_user_ids:			
			user_name = u.name			
			total,tax,discount = (False,)*3		
			sale_summary = self.env['pos.order'].search([
				('date_order','>=',sale_summary_rec.start_dt),
				('date_order','<=',sale_summary_rec.end_dt),
				('user_id','in',user_name),
			]).ids
			pos_line = self.env['pos.order.line'].search([('order_id.id','in',sale_summary)])			
			for p in pos_line:
				disc = 0
				if p.discount > 0 :
					disc =(p.price_unit * p.qty * p.discount)/100
				total = total + p.price_subtotal_incl
				discount = discount + disc
				tax = tax + (p.price_subtotal_incl - p.price_subtotal)
			summery_data.append({
				'name':u.name,
				'total':float(total),
				'tax':float(tax),
				'discount':float(discount),
			})
			# ================================== JOURNAL ================================ 

			config_obj = self.env['pos.config'].search([])
			orders = self.env['pos.order'].search([
				('date_order', '>=', sale_summary_rec.start_dt),
				('date_order', '<=', sale_summary_rec.end_dt),
				('state', 'in', ['paid','invoiced','done']),
				('config_id', 'in', config_obj.ids),
				('user_id','=',user_name),
			])
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
				journal = self.env.cr.dictfetchall()
			else:
				journal = []
			# ================================== CATEGORY ================================

			product_ids = self.env["pos.order"].search([('id', 'in', orders.ids)]).ids
			if product_ids:
				self.env.cr.execute("""
					SELECT (pc.name) c_name, sum(qty * price_unit) c_total
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
			main_data_dict.update({u.name:{'journal':journal,'categ':categ}})
		orders = self.env['pos.order'].search([
				('date_order', '>=', sale_summary_rec.start_dt),
				('date_order', '<=', sale_summary_rec.end_dt),
				('state', 'in', ['paid','invoiced','done']),
			])
		final_total = 0.0
		final_tax =0.0
		final_discount =0.0
		for order in orders:
			final_total += order.amount_total
			final_tax += order.amount_tax
			for line in order.lines:
				disc = 0
				if line.discount > 0 :
					disc =(line.price_unit * line.qty * line.discount)/100
				final_discount += disc
				category = line.product_id.pos_categ_id.name
				if category == False:
					category = "Unknown"
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
		only_summary = sale_summary_rec.only_summary
		return {
			'currency_precision': 2,
			'doc_ids': docids,
			'doc_model': 'pos.sale.summary.wizard',
			'docs': sale_summary_rec.res_user_ids,
			'user_name' : summery_data,
			'start_dt' : sale_summary_rec.start_dt,
			'end_dt' : sale_summary_rec.end_dt,
			'all_data':main_data_dict,
			'current_dt':datetime.now(),
			'journal':journal,
			'categ':categ,
			'only_summary':only_summary,
			'final_total':final_total,
			'final_tax':final_tax,
			'final_discount':final_discount,
			'payments': payments,
			'categories_data':categories_tot,
		}
	

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
