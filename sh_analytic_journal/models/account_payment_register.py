# -*- coding: UTF-8 -*-
# Part of Softhealer Technologies.

from odoo import models, fields


class AccountPaymentRegister(models.TransientModel):
    _inherit = 'account.payment.register'

    analytic_account_tag = fields.Boolean(
        string="Analytic Account & Tags"
    )

    analytic_id = fields.Many2one(
        'account.analytic.account',
        string="Analytic Account"
    )

    analytic_tag_ids = fields.Many2many(
        'account.analytic.tag',
        string="Analytic Tags"
    )

    def _create_payment_vals_from_wizard(self):
        res = super(
            AccountPaymentRegister, self
        )._create_payment_vals_from_wizard()
        res.update({
            'analytic_account_tag': self.analytic_account_tag,
            'analytic_id': self.analytic_id.id,
            'analytic_tag_ids': [(6, 0, self.analytic_tag_ids.ids)],
        })
        return res

    def _create_payment_vals_from_batch(self, batch_result):
        res = super(
            AccountPaymentRegister, self
        )._create_payment_vals_from_batch(batch_result)
        res.update({
            'analytic_account_tag': self.analytic_account_tag,
            'analytic_id': self.analytic_id.id,
            'analytic_tag_ids': [(6, 0, self.analytic_tag_ids.ids)],
        })
        return res