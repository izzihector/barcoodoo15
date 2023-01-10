# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.
from odoo import fields, models, api


class ProductProduct(models.Model):
    _inherit = 'product.product'

    margin_amount = fields.Float("Margin Amount", compute='_compute_get_margin_standard_list_price',
                                 groups="sh_all_in_one_margin.group_product_margin")
    margin_per = fields.Float("Margin Per (%)", compute='_compute_get_margin_product_percentage',
                              groups="sh_all_in_one_margin.group_product_margin")

    @api.depends('standard_price', 'list_price')
    def _compute_get_margin_standard_list_price(self):
        for rec in self:
            rec.margin_amount = 0.0
            if rec.standard_price and rec.list_price:
                rec.margin_amount = rec.list_price - rec.standard_price
            else:
                rec.margin_amount = 0.0

    @api.depends('margin_amount')
    def _compute_get_margin_product_percentage(self):
        for rec in self:
            rec.margin_per = 0.0
            if rec.standard_price and rec.list_price and rec.standard_price > 0:
                if rec.standard_price > 0.0:
                    rec.margin_per = (rec.margin_amount*100) / \
                        rec.standard_price
            else:
                rec.margin_per = 0.0


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    margin_amount = fields.Float("Margin Amount", compute='_compute_get_margin_standard_list_price',
                                 groups="sh_all_in_one_margin.group_product_margin")
    margin_per = fields.Float("Margin Per (%)", compute='_compute_get_margin_product_percentage',
                              groups="sh_all_in_one_margin.group_product_margin")

    @api.depends('standard_price', 'list_price')
    def _compute_get_margin_standard_list_price(self):
        for rec in self:
            rec.margin_amount = 0.0
            if rec.standard_price and rec.list_price:
                rec.margin_amount = rec.list_price - rec.standard_price
            else:
                rec.margin_amount = 0.0

    @api.depends('margin_amount')
    def _compute_get_margin_product_percentage(self):
        for rec in self:
            rec.margin_per = 0.0
            if rec.standard_price and rec.list_price and rec.standard_price > 0:
                if rec.standard_price > 0.0:
                    rec.margin_per = (rec.margin_amount*100) / \
                        rec.standard_price
            else:
                rec.margin_per = 0.0
