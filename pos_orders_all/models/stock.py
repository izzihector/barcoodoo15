# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _
from odoo.exceptions import Warning
import random
from odoo.tools import float_is_zero
from datetime import date, datetime

class stock_quant(models.Model):
	_inherit = 'stock.quant'

	def get_stock_location_qty(self, location):
		res = {}
		product_ids = self.env['product.product'].search([])
		for product in product_ids:
			quants = self.env['stock.quant'].search([('product_id', '=', product.id),('location_id', '=', location['id'])])
			if len(quants) > 1:
				quantity = 0.0
				for quant in quants:
					quantity += quant.quantity
				res.update({product.id : quantity})
			else:
				res.update({product.id : quants.quantity})
		return [res]

	def get_products_stock_location_qty(self, location,products):
		res = {}
		product_ids = self.env['product.product'].browse(products)
		for product in product_ids:
			quants = self.env['stock.quant'].search([('product_id', '=', product.id),('location_id', '=', location['id'])])
			if len(quants) > 1:
				quantity = 0.0
				for quant in quants:
					quantity += quant.quantity
				res.update({product.id : quantity})
			else:
				res.update({product.id : quants.quantity})
		return [res]

	def get_single_product(self,product, location):
		res = []
		pro = self.env['product.product'].browse(product)
		quants = self.env['stock.quant'].search([('product_id', '=', pro.id),('location_id', '=', location['id'])])
		if len(quants) > 1:
			quantity = 0.0
			for quant in quants:
				quantity += quant.quantity
			res.append([pro.id, quantity])
		else:
			res.append([pro.id, quants.quantity])
		return res


class product(models.Model):
	_inherit = 'product.product'
	
	available_quantity = fields.Float('Available Quantity')

	def get_stock_location_avail_qty(self, location,products):
		res = {}
		product_ids = self.env['product.product'].browse(products)
		for product in product_ids:
			quants = self.env['stock.quant'].search([('product_id', '=', product.id),('location_id', '=', location['id'])])
			outgoing = self.env['stock.move'].search([('product_id', '=', product.id),('location_id', '=', location['id'])])
			incoming = self.env['stock.move'].search([('product_id', '=', product.id),('location_dest_id', '=', location['id'])])
			qty=0.0
			product_qty = 0.0
			incoming_qty = 0.0
			if len(quants) > 1:
				for quant in quants:
					qty += quant.quantity

				if len(outgoing) > 0:
					for quant in outgoing:
						if quant.state not in ['done']:
							product_qty += quant.product_qty

				if len(incoming) > 0:
					for quant in incoming:
						if quant.state not in ['done']:
							incoming_qty += quant.product_qty
					product.available_quantity = qty-product_qty + incoming_qty
					res.update({product.id : qty-product_qty + incoming_qty})
			else:
				if not quants:
					if len(outgoing) > 0:
						for quant in outgoing:
							if quant.state not in ['done']:
								product_qty += quant.product_qty

					if len(incoming) > 0:
						for quant in incoming:
							if quant.state not in ['done']:
								incoming_qty += quant.product_qty
					product.available_quantity = qty-product_qty + incoming_qty
					res.update({product.id : qty-product_qty + incoming_qty})
				else:
					if len(outgoing) > 0:
						for quant in outgoing:
							if quant.state not in ['done']:
								product_qty += quant.product_qty

					if len(incoming) > 0:
						for quant in incoming:
							if quant.state not in ['done']:
								incoming_qty += quant.product_qty
					product.available_quantity = quants.quantity - product_qty + incoming_qty
					res.update({product.id : quants.quantity - product_qty + incoming_qty})
		return [res]
	

class StockPicking(models.Model):
	_inherit='stock.picking'

	@api.model
	def _create_picking_from_pos_order_lines(self, location_dest_id, lines, picking_type, partner=False):
		"""We'll create some picking based on order_lines"""

		pickings = self.env['stock.picking']
		stockable_lines = lines.filtered(lambda l: l.product_id.type in ['product', 'consu'] and not float_is_zero(l.qty, precision_rounding=l.product_id.uom_id.rounding))
		if not stockable_lines:
			return pickings
		positive_lines = stockable_lines.filtered(lambda l: l.qty > 0)
		negative_lines = stockable_lines - positive_lines

		if positive_lines:
			pos_order = positive_lines[0].order_id
			location_id = pos_order.location_id.id
			vals = self._prepare_picking_vals(partner, picking_type, location_id, location_dest_id)
			positive_picking = self.env['stock.picking'].create(vals)
			positive_picking._create_move_from_pos_order_lines(positive_lines)
			try:
				with self.env.cr.savepoint():
					positive_picking._action_done()
			except (UserError, ValidationError):
				pass

			pickings |= positive_picking
		if negative_lines:
			if picking_type.return_picking_type_id:
				return_picking_type = picking_type.return_picking_type_id
				return_location_id = return_picking_type.default_location_dest_id.id
			else:
				return_picking_type = picking_type
				return_location_id = picking_type.default_location_src_id.id

			vals = self._prepare_picking_vals(partner, return_picking_type, location_dest_id, return_location_id)
			negative_picking = self.env['stock.picking'].create(vals)
			negative_picking._create_move_from_pos_order_lines(negative_lines)
			try:
				with self.env.cr.savepoint():
					negative_picking._action_done()
			except (UserError, ValidationError):
				pass
			pickings |= negative_picking
		return pickings