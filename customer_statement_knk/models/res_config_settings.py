# -*- coding: utf-8 -*-
# Powered by Kanak Infosystems LLP.
# © 2020 Kanak Infosystems LLP. (<https://www.kanakinfosystems.com>).

import datetime
from dateutil.relativedelta import relativedelta

from odoo import api, fields, models


class ResCompany(models.Model):
    _inherit = 'res.company'

    statement_interval_unit = fields.Selection([
        ('weekly', 'Weekly'),
        ('fortnightly', 'Fortnightly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly')],
        default='weekly', string='Interval Units')
    statement_next_execution_date = fields.Date(string="Next Execution Date")

    def send_statement(self, from_date, to_date):
        for company in self:
            domain = [('invoice_date_due', '>=', from_date), ('invoice_date_due', '<=', to_date), ('payment_state', '!=', 'paid')]
            invoice_data = self.env['account.move'].read_group(domain, ['partner_id'], ['partner_id'])
            partners = list([inv['partner_id'][0] for inv in invoice_data])
            wizard = self.env['customer.statement.wizard'].create({
                'from_date': from_date,
                'to_date': to_date,
                'partner_ids': [(6, 0, partners)],
            })
            wizard.send_pdf()

    @api.model
    def send_customer_statement(self):
        records = self.search([('statement_next_execution_date', '<=', fields.Date.today())])
        if records:
            to_update = self.env['res.company']
            from_date = datetime.datetime.now()
            to_date = datetime.datetime.now()
            for record in records:
                to_update += record
                if record.statement_interval_unit == 'weekly':
                    next_update = relativedelta(weeks=+1)
                elif record.statement_interval_unit == 'fortnightly':
                    next_update = relativedelta(weeks=+2)
                elif record.statement_interval_unit == 'monthly':
                    next_update = relativedelta(months=+1)
                elif record.statement_interval_unit == 'quarterly':
                    next_update = relativedelta(months=+3)
                elif record.statement_interval_unit == 'yearly':
                    next_update = relativedelta(months=+12)
                else:
                    record.statement_next_execution_date = False
                    continue
                # record.statement_next_execution_date = datetime.datetime.now() + next_update
                from_date = datetime.date.today() - next_update
                to_date = datetime.date.today()
                to_update += record
            to_update.send_statement(from_date, to_date)


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    statement_interval_unit = fields.Selection(related="company_id.statement_interval_unit", readonly=False)
    statement_next_execution_date = fields.Date(related="company_id.statement_next_execution_date", readonly=False)

    @api.onchange('statement_interval_unit')
    def onchange_statement_interval_unit(self):
        if self.statement_interval_unit == 'weekly':
            next_update = relativedelta(weeks=+1)
        elif self.statement_interval_unit == 'fortnightly':
            next_update = relativedelta(weeks=+2)
        elif self.statement_interval_unit == 'monthly':
            next_update = relativedelta(months=+1)
        elif self.statement_interval_unit == 'quarterly':
            next_update = relativedelta(months=+3)
        elif self.statement_interval_unit == 'yearly':
            next_update = relativedelta(months=+12)
        else:
            self.statement_next_execution_date = False
            return
        self.statement_next_execution_date = datetime.date.today() + next_update
