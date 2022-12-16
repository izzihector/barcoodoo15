# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _
from datetime import date, datetime

class InheritPOSOrder(models.Model):
	_inherit = 'pos.order'

	sale_order_ids = fields.Many2many('sale.order',string="Imported Sale Order(s)")

	def _order_fields(self, ui_order):
		res = super(InheritPOSOrder, self)._order_fields(ui_order)
		config = self.env['pos.session'].browse(ui_order['pos_session_id']).config_id
		# import sale functionality
		
		if 'imported_sales' in ui_order and ui_order.get('imported_sales'):
			so = ui_order['imported_sales'].split(',')
			so.pop()
			so_ids = []
			sale_orders = []
			for odr in so:
				sale = self.env['sale.order'].browse(int(odr))
				if sale :
					so_ids.append(sale.id)
					sale_orders.append(sale)
			res.update({
				'sale_order_ids': [(6,0,so_ids)]
			})

			if config.cancle_order:
				
				for s in sale_orders:
					s.action_cancel()
		return res

	def create_sales_order(self, partner_id, orderlines,cashier_id):
		order_id = self.env['sale.order'].create({
			'partner_id': partner_id,
			'user_id':cashier_id
		})
		for ol in orderlines:
			product = self.env['product.product'].browse(ol.get('id'))	
			vals = {
				'product_id': ol.get('id'),
				'name':product.display_name,
				'product_uom_qty': ol.get('quantity'),
				'price_unit':ol.get('price'),
				'product_uom':ol.get('uom_id'),
				'tax_id': [(6,0,product.taxes_id.ids)],
				'discount': ol.get('discount'),
				'order_id': order_id.id
			}
			self.env['sale.order.line'].create(vals)					
		return order_id.name