# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from datetime import timedelta, date
from dateutil.relativedelta import relativedelta
from odoo import api, fields, models, _
from odoo.exceptions import UserError


class CustomerSaleAnalysisReport(models.AbstractModel):
    _name = 'report.bi_customer_sales_analysis.report_customersaleanalysis'
    _description = 'Customer Sale Analysis Report'

    # Fetch Month From Date
    def _get_months(self, start_date, end_date):
        # it works for geting month name between two dates.
        res = []
        start_date = fields.Date.from_string(start_date)
        end_date = fields.Date.from_string(end_date)
        while start_date <= end_date:
            month_names = str(start_date.strftime('%m')) + '/' + str(start_date.strftime('%Y'))
            res.append({'month_name': month_names,
                        'months_details': str(start_date.strftime('%m')),
                        'year_name': str(start_date.strftime('%Y'))})
            start_date += relativedelta(months=+1)
        return res

    # Summary Details From Sale Order and Account Invoice
    def _get_sale_analysis_summary(self, data, start_date, end_date, partnerid):
        res = []
        amount_sub_total = 0
        start_date = fields.Date.from_string(start_date)
        month_date = date(start_date.year, int(start_date.month), 1)
        end_date = fields.Date.from_string(end_date)
        diffrence = relativedelta(end_date,start_date).years * 12 + \
                    ((relativedelta(end_date,start_date).months) + 1) 
        company_id = data['company_id']
        for x in range(0, diffrence):
            res.append({'months_amount': 0.00,
                        'months_name': int(month_date.strftime('%m')),
                        'year_name': int(month_date.strftime('%Y'))})
            month_date += relativedelta(months=+1)
        # count and get sale Order
        sale_order_ids = self.env['sale.order'].search([
            ('partner_id', '=', partnerid), 
            ('company_id', '=', company_id[0]), 
            ('date_order', '<=', str(end_date)),
            ('date_order', '>=', str(start_date)),
            ('state', '!=', 'cancel')
        ])
        # Selected Accounts From Wizard
        account_ids = data['account_ids']
        for order in sale_order_ids:
            # Invoice Created From Sale Order

            invoice_ids = order.invoice_ids.filtered(lambda invoice:invoice.state != 'cancel')
            for invoice in invoice_ids:
                # Convert date to user timezone, otherwise the report will not be consistent with the
                # value displayed in the interface.
                date_from = fields.Datetime.from_string(order.date_order)
                date_from = fields.Datetime.context_timestamp(order, date_from).date()
                date_to = date_from + relativedelta(months=+1, day=1, days=-1)
                date_diffrence = relativedelta(date_to, date_from)
                # Update Record Base On Sale Order Order Date Month And Year
                for record in res:
                    if int(date_from.strftime('%m')) == record.get('months_name') \
                    and int(date_from.strftime('%Y')) == record.get('year_name'):
                        record['months_amount'] += invoice.amount_total or 0.00
                        record['months_name'] = int(date_from.strftime('%m') or '')
        return res

    # Subtotal Amount 
    def _get_data_subtotal_amount(self, data):
        result = []
        partner_ids = self.env['res.partner'].browse(data['partner'])
        for partner in partner_ids:
            amount_totals = 0.0
            sale_analysis_summary_records = self._get_sale_analysis_summary(data, data['start_date'], data['end_date'], partner.id)
            for record in sale_analysis_summary_records:
                amount_totals += record['months_amount']
            result.append({'partner_id': partner.id, 'amount_totals': amount_totals})
        return result

    # Final Balance Total
    def _get_data_subtotal_balance_amount(self, data):
        result = []
        amount_totals = 0.0
        get_data_subtotal_amount = self._get_data_subtotal_amount(data)
        for record in get_data_subtotal_amount:
            amount_totals += record['amount_totals']
        result.append({'amount_totals': amount_totals})
        return result

    # Month Wise Subtotal Amount 
    def _get_month_wise_data_subtotal_amount(self, data):
        result = []
        partner_ids = self.env['res.partner'].browse(data['partner'])
        get_months_records = self._get_months(data['start_date'], data['end_date'])
        for g_month in get_months_records:
            month_wise_amount_totals = 0.0
            for partner in partner_ids:
                sale_analysis_summary_records = self._get_sale_analysis_summary(data, data['start_date'], data['end_date'], partner.id)
                for sale_a in sale_analysis_summary_records:
                    if str(g_month['months_details']) == str(sale_a['months_name']) \
                        and str(g_month['year_name']) == str(sale_a['year_name']):
                        month_wise_amount_totals += sale_a['months_amount']
            result.append({'month_wis_amount_totals': month_wise_amount_totals})
        return result

    def _get_data_from_report(self, data):
        res = []
        Partner = self.env['res.partner']
        if 'partner' in data:
            res.append({'data':[]})
            partner_ids = Partner.browse(data['partner'])
            for partner in partner_ids:
                res[0]['data'].append({
                    'partner_name': partner.name,
                    'partner_id': partner.id,
                    'display': self._get_sale_analysis_summary(data, data['start_date'], data['end_date'], partner.id),
                    'subtotal_datas': self._get_data_subtotal_amount(data),
                })
        return res

    @api.model
    def _get_report_values(self, docids, data=None):
        if not data.get('form'):
            raise UserError(_("Form content is missing, this report cannot be printed."))
        customer_analysis_report = self.env['ir.actions.report']._get_report_from_name('bi_customer_sales_analysis.report_customersaleanalysis')
        partners = data['form']['partner']
        partner_ids = self.env['res.partner'].browse(partners)
        company = data['form']['company'][0]
        company_ids = self.env['res.company'].browse(company)
        return {
            'doc_ids': self.ids,
            'doc_model': customer_analysis_report.model,
            'docs': partner_ids,
            'company' : company_ids,
            'get_months': self._get_months(data['form']['start_date'], data['form']['end_date']),
            'get_data_from_report': self._get_data_from_report(data['form']),
            'month_wise_data_from_report': self._get_month_wise_data_subtotal_amount(data['form']),
            'get_subtotal_balance_amount': self._get_data_subtotal_balance_amount(data['form']),
        }
