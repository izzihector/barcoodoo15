# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _
from datetime import date, datetime

class pos_config(models.Model):
	_inherit = 'pos.config'

	def _get_default_location(self):
		return self.env['stock.warehouse'].search([('company_id', '=', self.env.user.company_id.id)], limit=1).lot_stock_id
	
	
	# pos orders screen
	show_order = fields.Boolean('Show Orders')
	pos_session_limit = fields.Selection([('all',  "Load all Session's Orders"), ('last3', "Load last 3 Session's Orders"), ('last5', " Load last 5 Session's Orders"),('current_day', "Only Current Day Orders"), ('current_session', "Only Current Session's Orders")], string='Session limit',default="current_day")
	show_barcode = fields.Boolean('Show Barcode in Receipt')
	show_draft = fields.Boolean('Show Draft Orders')
	show_posted = fields.Boolean('Show Posted Orders')

	# import sale functionality
	check = fields.Boolean(string='Import Sale Order', default=False)
	load_orders_days = fields.Integer('Load Orders of Last Days')
	load_draft_sent = fields.Boolean(string='Load only draft/sent sale orders', default=False)
	cancle_order = fields.Boolean(string='Cancel Sale Order after Import', default=False)

	# bag charges functionality
	pos_bag_category_id = fields.Many2one('pos.category','Bag Charges Category')
	allow_bag_charges = fields.Boolean('Allow Bag Charges')

	auto_check_invoice = fields.Boolean(string='Invoice Auto Check') 

	# discount
	discount_type = fields.Selection([('percentage', "Percentage"), 
		('fixed', "Fixed")], string='Discount Type', default='percentage', 
		help='Seller can apply different Discount Type in POS.')


	# pos stock
	pos_display_stock = fields.Boolean(string='Display Stock in POS')
	pos_stock_type = fields.Selection([('onhand', 'Qty on Hand'), ('incoming', 'Incoming Qty'), ('outgoing', 'Outgoing Qty'), ('available', 'Qty Available')], string='Stock Type', help='Seller can display Different stock type in POS.')
	pos_allow_order = fields.Boolean(string='Allow POS Order When Product is Out of Stock')
	pos_deny_order = fields.Char(string='Deny POS Order When Product Qty is goes down to')   
	show_stock_location = fields.Selection([('all', 'All Warehouse'),
		('specific', 'Current Session Warehouse')],default='all',string='Show Stock Of')
	stock_location_id = fields.Many2one(
		'stock.location', string='Stock Location',
		domain=[('usage', '=', 'internal')], required=True, 
		default=_get_default_location)

	# Credit note
	credit_note = fields.Selection([('create_note','Create Return order Credit note'),
		('not_create_note','Do not Create Return order Credit note')], string = "Credit note configuration" , default = "create_note")
