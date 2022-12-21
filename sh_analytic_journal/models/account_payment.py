# -*- coding: UTF-8 -*-
# Part of Softhealer Technologies.

from odoo import models, fields, api


class AccountPayment(models.Model):
    _inherit = 'account.payment'

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

    @api.model
    def create(self, vals):
        res = super(AccountPayment, self).create(vals)
        if res.move_id and res.move_id.line_ids:
            for line in res.move_id.line_ids:
                line.sudo().write({
                    'analytic_account_id': res.analytic_id.id,
                    'analytic_tag_ids': [(6, 0, res.analytic_tag_ids.ids)]
                    })
        return res

    def write(self, vals):
        res = super(AccountPayment, self).write(vals)
        if self and self.move_id and self.move_id.line_ids:
            for line in self.move_id.line_ids:
                line.sudo().write({
                    'analytic_account_id': self.analytic_id.id,
                    'analytic_tag_ids': [(6, 0, self.analytic_tag_ids.ids)]
                    })
        return res
