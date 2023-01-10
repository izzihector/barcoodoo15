# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.

from odoo import fields, models, api


class AccountInvoiceReport(models.Model):
    _inherit = 'account.invoice.report'

    product_margin_amount = fields.Float(
        string="Margin Amount",
        groups="sh_all_in_one_margin.group_product_margin")

    product_margin_amount = fields.Float(
        string="Unit Margin",
        groups="sh_all_in_one_margin.group_product_margin")

    total_margin_amount = fields.Float(
        string="Total Margin Amount",
        groups="sh_all_in_one_margin.group_product_margin")

    def _select(self):
        return super(AccountInvoiceReport, self)._select(
        ) + ", line.product_margin_amount , line.total_margin_amount"

    def _sub_select(self):
        return super(AccountInvoiceReport, self)._sub_select(
        ) + ", SUM(ail.product_margin_amount ) AS product_margin_amount, SUM(ail.total_margin_amount ) AS total_margin_amount"


class SaleReport(models.Model):
    _inherit = "sale.report"

    product_margin_amount = fields.Float(
        string="Unit Margin",
        groups="sh_all_in_one_margin.group_product_margin")

    total_margin_amount = fields.Float(
        string="Total Margin Amount",
        groups="sh_all_in_one_margin.group_product_margin")

    def _query(self, with_clause='', fields={}, groupby='', from_clause=''):
    
        fields['product_margin_amount'] = ", SUM(l.product_margin_amount ) as product_margin_amount"
        fields['total_margin_amount'] = ", SUM(l.total_margin_amount ) as total_margin_amount"
        return super(SaleReport, self)._query(with_clause, fields, groupby,
                                              from_clause)
