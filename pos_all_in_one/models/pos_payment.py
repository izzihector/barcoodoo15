# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.


from odoo import fields, models, api, _
from odoo.exceptions import Warning
import random
from datetime import date, datetime

class PaymentNote(models.Model):
	_inherit = 'account.payment'
	
	notes_pos = fields.Text('Notes')


class POSConfigPayment(models.Model):
	_inherit = 'pos.config'
	
	allow_pos_payment = fields.Boolean('Allow POS Payments')
	allow_pos_invoice = fields.Boolean('Allow POS Invoice Payment and Validation')

class pos_create_customer_payment(models.Model):
	_name = 'pos.create.customer.payment'
	_description = "POS Create Customer Payment"

	def create_customer_payment(self, partner_id, journal, amount, note):
		payment_object = self.env['account.payment']
		partner_object = self.env['res.partner']							

		vals = {
			'payment_type':'inbound', 
			'partner_type':'customer', 
			'partner_id':partner_id, 
			'journal_id':int(journal), 
			'notes_pos':note,
			'amount':amount, 
			'date': fields.Date.today(), 
			'payment_method_id':1
		}
		
		a = payment_object.create(vals) # Create Account Payment
		a.action_post() # Confirm Account Payment
		
		return True
		
	def create_customer_payment_inv(self, partner_id, journal, amount, invoice, note):
		payment_object = self.env['account.payment']
		partner_object = self.env['res.partner']
		inv_obj = self.env['account.move'].search([('id','=',invoice['id'])],limit=1)
		
		vals = {
			'payment_type':'inbound', 
			'partner_type':'customer', 
			'partner_id':partner_id, 
			'journal_id':int(journal), 
			'ref': inv_obj.name,
			'notes_pos':note,
			'amount':amount, 
			'date': fields.Date.today(), 
			'payment_method_id':1
		}
		
		a = payment_object.create(vals) # Create Account Payment
		a.action_post() # Confirm Account Payment
		to_reconcile = []
		to_reconcile.append(inv_obj.line_ids)
		domain = [('account_internal_type', 'in', ('receivable', 'payable')), ('reconciled', '=', False)]
		for payment_object, lines in zip(a, to_reconcile):
			payment_lines = payment_object.line_ids.filtered_domain(domain)
			for account in payment_lines.account_id:
				(payment_lines + lines)\
					.filtered_domain([('account_id', '=', account.id), ('reconciled', '=', False)])\
					.reconcile()
						
		return True
	

