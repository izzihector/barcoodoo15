# -*- coding: utf-8 -*-
# Powered by Kanak Infosystems LLP.
# © 2020 Kanak Infosystems LLP. (<https://www.kanakinfosystems.com>).

from odoo import models


class ResPartner(models.Model):
    _inherit = 'res.partner'

    def get_customer_opbalance(self, from_date, to_date):
        domain = [('partner_id', '=', self.id), ('move_id.state', '=', 'posted'), ('account_id.internal_type', 'in', ['payable', 'receivable'])]
        debit = 0.0
        credit = 0.0
        balance = 0.0
        if from_date:
            domain += [('date', '<', from_date)]
        for d in self.env['account.move.line'].read_group(domain, ['debit', 'credit', 'balance'], ['partner_id']):
            debit += d['debit']
            credit += d['credit']
            balance += d['balance']
        return {'debit': debit, 'credit': credit, 'balance': balance}

    def get_customer_statements(self, from_date, to_date):
        domain = [('partner_id', '=', self.id), ('move_id.state', '=', 'posted'), ('account_id.internal_type', 'in', ['payable', 'receivable'])]
        if from_date and to_date:
            domain += [('date', '>=', from_date),
                       ('date', '<=', to_date)]
        return self.env['account.move.line'].search(domain, order='date')

    def action_view_statements(self):
        self.ensure_one()
        action = self.env.ref('account.action_move_out_invoice_type').read()[0]
        action['domain'] = [
            ('move_type', 'in', ('out_invoice', 'out_refund')),
            ('state', '=', 'posted'),
            ('partner_id', 'child_of', self.id),
            ('payment_state', '=', 'not_paid'),
        ]
        return action
