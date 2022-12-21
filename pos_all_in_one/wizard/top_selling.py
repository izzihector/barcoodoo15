# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _
from datetime import date, datetime
from odoo.exceptions import Warning ,ValidationError


class PosSalesSummary(models.TransientModel):

	_name='pos.top.selling.wizard'
	_description = "POS Top Selling Wizard"

	start_dt = fields.Date('Start Date', required = True)
	end_dt = fields.Date('End Date', required = True)
	report_type = fields.Char('Report Type', readonly = True, default='PDF')
	no_product=fields.Integer("Number of Records (Top)",required=True)
	top_selling=fields.Selection([('products', 'Products'),('customers', 'Customers'),('categories', 'Categories'),
		], string="Top Selling",default="products")
	
	def top_selling_generate_report(self):
		if(self.start_dt <= self.end_dt):
			return self.env.ref('pos_all_in_one.action_top_selling_report').report_action(self)
		else:
			raise ValidationError(_("Please enter valid start and end date."))