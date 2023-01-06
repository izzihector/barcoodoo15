# -*- coding: utf-8 -*-
# Powered by Kanak Infosystems LLP.
# © 2020 Kanak Infosystems LLP. (<https://www.kanakinfosystems.com>).

from odoo import api, models, _
from odoo.exceptions import UserError


class PartnerStatementPDF(models.AbstractModel):
    _name = 'report.customer_statement_knk.report_customer_statement_pdf'
    _description = 'Customer Statement Report'

    @api.model
    def _get_report_values(self, docids, data=None):
        from_date = False
        to_date = False
        ctx = self.env.context
        if data:
            docids = data.get('partner_ids', docids)
            from_date = data.get('from_date', False)
            to_date = data.get('to_date', False)
        if not from_date and not to_date:
            from_date = ctx.get('from_date', False)
            to_date = ctx.get('to_date', False)
        if not docids:
            raise UserError(_("content is missing, this report cannot be printed."))

        model = 'res.partner'
        docs = self.env[model].browse(docids)
        return {
            'doc_ids': self.ids,
            'doc_model': model,
            'docs': docs,
            'from_date': from_date,
            'to_date': to_date
        }
