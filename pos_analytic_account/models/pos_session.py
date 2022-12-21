from odoo import models, fields


class PosSession(models.Model):
    _inherit = 'pos.session'

    account_analytic_id = fields.Many2one(comodel_name='account.analytic.account', string='Analytic Account', copy=False)

    def _prepare_line(self, order_line):
        res = super(PosSession, self)._prepare_line(order_line)
        res['analytic_account_id'] = order_line.order_id.account_analytic_id or False
        return res

    def _get_sale_vals(self, key, amount, amount_converted):
        res = super(PosSession, self)._get_sale_vals(key, amount,
                                                     amount_converted)
        res['analytic_account_id'] = self.account_analytic_id.id or False
        return res

    def _get_stock_output_vals(self, out_account, amount, amount_converted):
        res = super(PosSession, self)._get_stock_output_vals(out_account, amount, amount_converted)
        if not self.company_id.anglo_saxon_accounting:
            res['analytic_account_id'] = self.account_analytic_id.id or False
        return res

    def _get_stock_expense_vals(self, exp_account, amount, amount_converted):
        res = super(PosSession, self)._get_stock_expense_vals(exp_account, amount, amount_converted)
        if self.company_id.anglo_saxon_accounting:
            res['analytic_account_id'] = self.account_analytic_id.id or False
        return res

    def write(self, vals):
        for session in self:
            if not session.account_analytic_id:
                vals['account_analytic_id'] = \
                    session.config_id.account_analytic_id.id or False
        return super(PosSession, self).write(vals)
