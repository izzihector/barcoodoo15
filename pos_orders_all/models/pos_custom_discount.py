# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.
from odoo import fields, models, api, _

class PosDiscount(models.Model):
	_name = 'pos.custom.discount'
	_description = "POS Custom Discount"

	name = fields.Char('Name', required=True)
	discount = fields.Float('Discount(%)', required=True)
	description = fields.Text("Description")
	available_pos_ids = fields.Many2many('pos.session', 'pos_session_discount', 'pos_discount_id', string='Available in POS')
	

class PosConfig(models.Model):
	_inherit = 'pos.config'
	
	allow_custom_discount = fields.Boolean('Allow Custom Discount')
	custom_discount_ids = fields.Many2many('pos.custom.discount', string='Discounts')
	

