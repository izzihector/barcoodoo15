# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _
from datetime import date, datetime
from odoo.exceptions import Warning ,ValidationError

class PosSalesSummary(models.TransientModel):

	_name='pos.sale.summary.wizard'
	_description = "POS Sale Summary Wizard"

	start_dt = fields.Date('Start Date', required = True)
	end_dt = fields.Date('End Date', required = True)
	report_type = fields.Char('Report Type', readonly = True, default='PDF')
	only_summary = fields.Boolean('Only Summary')
	res_user_ids = fields.Many2many('res.users', default=lambda s: s.env['res.users'].search([]))


	def sale_summary_generate_report(self):
		if(self.start_dt <= self.end_dt):
			return self.env.ref('pos_all_in_one.action_sales_summary_report').report_action(self)
		else:
			raise ValidationError(_("Please enter valid start and end date."))