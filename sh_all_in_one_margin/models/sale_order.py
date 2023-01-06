# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.
from odoo import fields, models, api


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    margin_amount = fields.Float(
        "Margin Amount",
        compute='_compute_get_product_margin_amount_all',
        groups="sh_all_in_one_margin.group_product_margin")
    cost_amount = fields.Float(
        "Cost Amount",
        compute='_compute_get_product_margin_amount_all',
        groups="sh_all_in_one_margin.group_product_margin")
    margin_per = fields.Float(
        "Margin Per (%)",
        compute='_compute_get_product_margin_percentage_all',
        groups="sh_all_in_one_margin.group_product_margin")

    line_margin_amount_total = fields.Float(
        compute="_compute_line_margin_amount_total",
        string="Total Margin Amount",
        groups="sh_all_in_one_margin.group_product_margin")

    @api.depends('order_line.product_margin_amount',
                 'order_line.product_cost_price')
    def _compute_get_product_margin_amount_all(self):
        if self:
            for rec in self:
                rec.margin_amount = 0.0
                margin_amount_all = 0.0
                cost_amount = 0.0
                for line in rec.order_line:
                    margin_amount_all += line.product_margin_amount
                    cost_amount += line.product_cost_price

                rec.margin_amount = margin_amount_all
                rec.cost_amount = cost_amount

    @api.depends("order_line.total_margin_amount")
    def _compute_line_margin_amount_total(self):
        for rec in self:
            rec.line_margin_amount_total = 0.0
            total = 0.0
            if rec.order_line:
                for line in rec.order_line:
                    total = total + line.total_margin_amount
            rec.line_margin_amount_total = total

    @api.depends('margin_amount', 'amount_total', 'cost_amount')
    def _compute_get_product_margin_percentage_all(self):
        if self:
            for rec in self:
                rec.margin_per = 0.0
                if rec.margin_amount and rec.amount_total and rec.amount_total > 0:
                    if rec.cost_amount > 0.0:
                        rec.margin_per = (rec.margin_amount *
                                          100) / rec.cost_amount
                else:
                    rec.margin_per = 0.0


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    product_margin_amount = fields.Float(
        string="Unit Margin",
        compute='_compute_get_margin_unit_price',
        compute_sudo=True,
        groups="sh_all_in_one_margin.group_product_margin",store=True)
        
    product_cost_price = fields.Float(
        "Cost price",
        compute_sudo=True,
        compute='_compute_get_margin_unit_price',
        groups="sh_all_in_one_margin.group_product_margin")

    total_margin_amount = fields.Float(
        compute='get_margin_total_price',
        compute_sudo=True,
        groups="sh_all_in_one_margin.group_product_margin",store=True)

    @api.depends('product_uom_qty', 'price_subtotal',
                 'product_id.standard_price')
    def get_margin_total_price(self):
        for rec in self:
            rec.total_margin_amount = 0.0
            rec.total_margin_amount = rec.price_subtotal - (
                rec.product_id.standard_price * rec.product_uom_qty)

    @api.onchange('product_id')
    def get_margin_product_id(self):
        for rec in self:
            rec.product_margin_amount = 0.0
            if rec.product_id:
                rec.product_margin_amount = rec.product_id.list_price - rec.product_id.standard_price
                rec.product_cost_price = rec.product_id.standard_price
            else:
                rec.product_margin_amount = 0.0
                rec.product_cost_price = 0.0

    @api.depends('price_unit')
    def _compute_get_margin_unit_price(self):
        for data in self:
            data.product_cost_price = 0.0
            if data.product_id:
                data.product_margin_amount = data.price_unit - data.product_id.standard_price
                data.product_cost_price = data.product_id.standard_price
            else:
                data.product_margin_amount = 0.0
                data.product_cost_price = 0.0
