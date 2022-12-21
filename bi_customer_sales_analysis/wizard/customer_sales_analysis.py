# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, tools, _
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT as DTF
import xlsxwriter
import base64



class CustomerSalesAnalysisWiz(models.TransientModel):
    _name = "customer.sale.analysis.wiz"
    _description = 'Customer Sale Analysis Report'

    company_id = fields.Many2one('res.company', string='Company', required=True,default=lambda self: self.env.company.id)
    account_ids = fields.Many2many('account.account', string='Accounts', domain="[('internal_type', '=', 'receivable')]")
    start_date = fields.Date(string='Start Date',
                            default=datetime.now().date().replace(month=1, day=1))
    end_date = fields.Date(string='End Date',
                            default=datetime.now().date().replace(month=12, day=31))
    partner_ids = fields.Many2many('res.partner', string='Customers')
    document = fields.Binary('File To Download')
    file = fields.Char('Report File Name', readonly=1)

    def print_pdf_report(self):
        self.ensure_one()
        [data] = self.read()
        data['partner'] = data['partner_ids']
        data['company'] = data['company_id']
        partners = self.env['res.partner'].browse(data['partner'])
        datas = {
             'ids': [1],
             'model': 'res.partner',
             'form': data
        }
        return self.env.ref('bi_customer_sales_analysis.action_report_customer_sale_analysis').report_action(partners, data=datas)

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
        for x in range(0, diffrence):
            res.append({'months_amount': 0.00,
                        'months_name': int(month_date.strftime('%m')),
                        'year_name': int(month_date.strftime('%Y'))})
            month_date += relativedelta(months=+1)
        # count and get sale Order
        sale_order_ids = self.env['sale.order'].search([ 
            ('partner_id', '=', partnerid),
            ('company_id','=',self.company_id.ids), 
            ('date_order', '<=', str(end_date)),
            ('date_order', '>=', str(start_date)),
            ('state', '!=', 'cancel')
        ])
        
        # Selected Accounts From Wizard
        account_ids = data['account_ids']
        for order in sale_order_ids:
            
            # Invoice Created From Sale Order
            invoice_ids = order.invoice_ids.filtered(lambda invoice: invoice.state != 'cancel')
            
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
    def get_data_subtotal_balance_amount(self, data):
        result = []
        amount_totals = 0.0
        get_data_subtotal_amount = self._get_data_subtotal_amount(data)
        for record in get_data_subtotal_amount:
            amount_totals += record['amount_totals']
        result.append({'amount_totals': amount_totals})
        return result

    # Month Wise Subtotal Amount 
    def get_month_wise_data_subtotal_amount(self, data):
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

    def get_data_from_report(self, data):
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

    def print_excel_report(self):
        self.ensure_one()
        [data] = self.read()
        data['partner'] = data['partner_ids']
        file_path = 'Customer Sale Analysis' + '.xlsx'
        workbook = xlsxwriter.Workbook('/tmp/' + file_path)
        worksheet = workbook.add_worksheet('Customer Sale Analysis')

        start_date = datetime.strptime(str(data.get('start_date', False)), '%Y-%m-%d').date()
        month_date = date(start_date.year, int(start_date.month), 1)
        date_start = datetime.strptime(str(data.get('start_date', False)), '%Y-%m-%d').date()
        end_date = datetime.strptime(str(data.get('end_date', False)), '%Y-%m-%d').date()

        Partner = data.get('partner_ids', False)
        PartnerObje = self.env['res.partner'].browse(Partner)

        user_company = self.env.user.company_id
        header_format = workbook.add_format({'bold': True,'valign':'vcenter','font_size':16,'align': 'center','bg_color':'#D8D8D8'})
        month_format = workbook.add_format({'bold': True,'valign':'vcenter','font_size':12,'align': 'center'})
        title_format = workbook.add_format({'bold': True, 'valign': 'vcenter','align': 'center', 'font_size':14,'bg_color':'#D8D8D8'})
        cell_wrap_format = workbook.add_format({'valign':'vjustify','valign':'vcenter','align': 'left','font_size':12,}) ##E6E6E6
        amount_cell_wrap_format = workbook.add_format({'valign':'vjustify','valign':'vcenter','align': 'right','font_size':12})

        worksheet.set_row(1,20)  #Set row height
        #Merge Row Columns
        worksheet.set_column(0,0, 30)
        TITLEHEDER = 'CUSTOMER SALES ANALYSIS' 
        diffrence = relativedelta(end_date,start_date).years * 12 + \
                    ((relativedelta(end_date,start_date).months) + 1)
        month_range = (diffrence + 1)
        worksheet.set_column(1,int(month_range), 15)
        worksheet.merge_range(0, 0, 1, month_range,TITLEHEDER , header_format)#Title Format
        worksheet.merge_range(3, 0, 4, 0,'Name', title_format)
        col = 1
        get_months_records = self._get_months(data['start_date'], data['end_date'])
        for g_months in get_months_records:
            worksheet.write(3, col, 'x', month_format)
            worksheet.write(4, col, str(g_months['month_name']), month_format)
            col += 1
            worksheet.merge_range(3, month_range, 4, month_range,'BALANCE', title_format)
        row = 6
        for obj in self.get_data_from_report(data):
            for emp in obj['data']:
                worksheet.write(row, 0, str(emp['partner_name']), cell_wrap_format)
                col = 1
                for details in emp['display']:
                    worksheet.write(row, col, str('%.2f' % details['months_amount']), amount_cell_wrap_format)
                    col += 1
                for total_obj in emp['subtotal_datas']:
                    if emp['partner_id'] == total_obj['partner_id']:
                        worksheet.write(row, col, str('%.2f' % total_obj['amount_totals']), amount_cell_wrap_format)
                        row += 1

        col = 0
        row = row+1
        worksheet.write(row, col, 'BALANCE', title_format)
        col += 1
        for obj in self.get_month_wise_data_subtotal_amount(data):
            worksheet.write(row, col, str('%.2f' % obj['month_wis_amount_totals']), amount_cell_wrap_format)
            col += 1
            for total_obj in self.get_data_subtotal_balance_amount(data):
                worksheet.write(row, col, str('%.2f' % total_obj['amount_totals']), amount_cell_wrap_format)

        workbook.close()
        buf = base64.b64encode(open('/tmp/' + file_path, 'rb+').read())
        self.document = buf
        self.file = 'Customer Sale Analysis'+'.xlsx'
        return {
            'res_id': self.id,
            'name': 'Files to Download',
            'view_type': 'form',
            "view_mode": 'form,tree',
            'res_model': 'customer.sale.analysis.wiz',
            'type': 'ir.actions.act_window',
            'target': 'new',
        }

    def action_back(self):
        if self._context is None:
            self._context = {}
        return {
            'type': 'ir.actions.act_window',
            'view_type': 'form',
            'view_mode': 'form',
            'res_model': 'customer.sale.analysis.wiz',
            'target': 'new',
        }
