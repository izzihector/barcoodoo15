# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _, tools
from datetime import date, time, datetime
from odoo import exceptions, _
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
from odoo.exceptions import UserError, ValidationError,Warning
import logging
_logger = logging.getLogger(__name__)

class res_partner(models.Model):
	_inherit = 'res.partner'

	loyalty_points = fields.Integer(string='Loyalty Points',compute='_compute_loyalty_points',store=True)
	loyalty_amount = fields.Float('Loyalty Amount')
	loyalty_history_ids = fields.One2many('pos.loyalty.history','partner_id',string='Loyalty history')

	@api.depends('loyalty_history_ids','loyalty_history_ids.points','loyalty_history_ids.transaction_type')
	def _compute_loyalty_points(self):
		for rec in self:
			rec.loyalty_points = 0
			for history in rec.loyalty_history_ids :
				if history.transaction_type == 'credit' :
					rec.loyalty_points += history.points
				else:
					rec.loyalty_points -= history.points

	def action_view_loyalty_points(self):
		self.ensure_one()

		partner_loyalty_ids = self.env['pos.loyalty.history'].search([('partner_id','=',self.id)])

		return {
			'name': 'Loyalty Details',
			'type': 'ir.actions.act_window',
			'view_mode': 'tree,form',
			'res_model': 'pos.loyalty.history',
			'domain': [('partner_id', '=', self.id)],
		}


class pos_category(models.Model):
	_inherit = 'pos.category'

	Minimum_amount  = fields.Integer("Amount For loyalty Points")
	amount_footer = fields.Integer('Amount', related='Minimum_amount')

		
class pos_loyalty_setting(models.Model):
	_name = 'pos.loyalty.setting'
	_description = 'POS Loyalty Settings'  

	name  = fields.Char('Name' ,default='Configuration for POS Loyalty Management')
	product_id  = fields.Many2one('product.product','Product', domain = [('type', '=', 'service'),('available_in_pos','=',True)])
	issue_date  =  fields.Date(default=fields.date.today(),required=True)
	expiry_date  = fields.Date('Expiry date',required=True)
	loyalty_basis_on = fields.Selection([('amount', 'Purchase Amount'), ('pos_category', 'POS Product Categories')], string='Loyalty Basis On', help='Where you want to apply Loyalty Method in POS.')
	active  =  fields.Boolean('Active')
	loyality_amount = fields.Float('Amount')
	amount_footer = fields.Float('Amount.', related='loyality_amount')
	redeem_ids = fields.One2many('pos.redeem.rule', 'loyality_id', 'Redemption Rule')
	company_id = fields.Many2one('res.company', string='Company', required=True, default=lambda self: self.env.company)

	@api.constrains('issue_date','expiry_date','active')
	def check_date(self):
		if self.expiry_date < self.issue_date :
			msg = _("Expiry Date should not be smaller than Issue Date. please change dates.")
			raise exceptions.ValidationError(msg)
		flag = False
		for record in self.search([('active','=',True)]):
			if self.id != record.id:
				if (record.issue_date <= self.issue_date <=record.expiry_date) or (record.issue_date <= self.expiry_date <=record.expiry_date) : 
					flag = True
					break
				if record.issue_date >= self.issue_date <=record.expiry_date : 
					flag = True
					break
		if flag: 	
			msg = _("You can not apply two Loyalty Configuration within same date range please change dates.")
			raise exceptions.ValidationError(msg)


class pos_redeem_rule(models.Model):
	_name = 'pos.redeem.rule'    
	_description = 'POS Redemption Rule'  

	name = fields.Char('Name' ,default='Configuration for Website Redemption Management')
	min_amt = fields.Integer('Minimum Points')
	max_amt = fields.Integer('Maximum Points')
	reward_amt = fields.Integer('Redemption Amount')
	loyality_id = fields.Many2one('pos.loyalty.setting', 'Loyalty ID')
	company_id = fields.Many2one('res.company', string='Company', required=True, default=lambda self: self.env.company)

	@api.onchange('max_amt','min_amt')
	def _check_amt(self):
		if (self.max_amt !=0):
			if(self.min_amt > self.max_amt):
				msg = _("Minimum Point should not larger than Maximum Point")
				raise exceptions.ValidationError(msg)
		return

	@api.onchange('reward_amt')
	def _check_reward_amt(self):
		if self.reward_amt !=0:
			if self.reward_amt <= 0:			
				msg = _("Reward amount should not zero or less than zero")
				raise exceptions.ValidationError(msg)
		return

	@api.constrains('min_amt','max_amt')
	def _check_points(self):
		for line in self:
			record = self.env['pos.redeem.rule'].search([('loyality_id','=',line.loyality_id.id)])
			for rec in record :
				if line.id != rec.id:
					if (rec.min_amt <= line.min_amt  <= rec.max_amt) or (rec.min_amt <=line.max_amt  <= rec.max_amt):
						msg = _("You can not create Redemption Rule with same points range.")
						raise exceptions.ValidationError(msg)
						return


class pos_loyalty_history(models.Model):
	_name = 'pos.loyalty.history'
	_rec_name = 'order_id'
	_order = 'id desc'
	_description = 'POS Loyalty History'  

	order_id  = fields.Many2one('pos.order','POS Order')
	partner_id  = fields.Many2one('res.partner','Customer')
	date  =  fields.Datetime(default = datetime.now(), )
	transaction_type = fields.Selection([('credit', 'Credit'), ('debit', 'Debit')], string='Transaction Type', help='credit/debit loyalty transaction in POS.')
	points = fields.Integer('Loyalty Points')
	company_id = fields.Many2one('res.company', string="Company", default=lambda self: self.env.company, required=True)


class pos_order(models.Model):
	_inherit = 'pos.order'

	@api.model
	def create_from_ui(self, orders, draft=False):
		order_ids = super(pos_order, self).create_from_ui(orders, draft=False)
		loyalty_history_obj = self.env['pos.loyalty.history']
		today_date = datetime.today().date() 
		loyalty_setting = self.env['pos.loyalty.setting'].sudo().search([('active','=',True),('issue_date', '<=', today_date ),
							('expiry_date', '>=', today_date )])
		if loyalty_setting:
			for order_id in orders:
				if not order_id['data'].get('is_paying_partial',False):
					try:
						pos_order_id = self.search([('pos_reference','=',order_id['data'].get('name'))])
						if pos_order_id:
							ref_order = [o['data'] for o in orders if o['data'].get('name') == pos_order_id.pos_reference]
							for order in ref_order:
								cust_loyalty = pos_order_id.partner_id.loyalty_points + order.get('loyalty')
								order_loyalty = order.get('loyalty')
								redeemed = order.get('redeemed_points')
								if order_loyalty > 0:
									vals = {
										'order_id':pos_order_id.id,
										'partner_id': pos_order_id.partner_id.id,
										'date' : datetime.now(),
										'transaction_type' : 'credit',
										'points': order_loyalty
									}
									loyalty_history = loyalty_history_obj.create(vals)
								if order.get('redeem_done') == True:
									vals = {
										'order_id':pos_order_id.id,
										'partner_id': pos_order_id.partner_id.id,
										'date' : datetime.now(),
										'transaction_type' : 'debit',
										'points': redeemed
									}
									loyalty_history = loyalty_history_obj.create(vals)
							
					except Exception as e:
						_logger.error('Error in point of sale validation: %s', tools.ustr(e))
		return order_ids	
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:    
