# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _
from datetime import date, datetime
from odoo.exceptions import Warning ,ValidationError


class PosProfitLoss(models.TransientModel):

	_name='pos.profit.loss.wizard'
	_description = "POS Profit Loss Wizard"

	start_dt = fields.Date('Start Date', required = True)
	end_dt = fields.Date('End Date', required = True)

	def pos_profit_loss_report(self):
		if(self.start_dt <= self.end_dt):
			return self.env.ref('pos_all_in_one.action_profit_loss_report').report_action(self)
		else:
			raise ValidationError(_("Please enter valid start and end date."))