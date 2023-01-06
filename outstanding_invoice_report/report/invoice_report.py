# -*- coding: utf-8 -*-
# Part of Odoo, Aktiv Software PVT. LTD.
# See LICENSE file for full copyright & licensing details.

from odoo import api, models


class ReportInvoices(models.AbstractModel):
    _name = "report.outstanding_invoice_report.report_invoice_outstanding"
    _description = "Report Invoices"

    """Find Outstanding invoices between the date and find total outstanding amount"""

    @api.model
    def _get_report_values(self, docids, data=None):
        move_type = "out_invoice"
        if data["form"]["invoice_type"] == "vendor":
            move_type = "in_invoice"

        order_by = "partner_id, invoice_date_due"
        if data["form"]["order_by"] == "invoice_date":
            order_by = "partner_id, invoice_date"

        if data["form"]["sort_by"] == "desc":
            order_by += " desc"

        customer_data = {}
        # prepare domain for invoice.
        domain = [
            ("invoice_date_due", ">=", data["form"]["start_date"]),
            ("invoice_date_due", "<=", data["form"]["end_date"]),
            ("move_type", "=", move_type),
            ("state", "=", "posted"),
        ]

        # Apply domain to filter invoices by partners.
        if data["form"]["partner_ids"]:
            domain += [("partner_id", "in", data["form"]["partner_ids"])]

        invoices = self.env["account.move"].search(domain, order=order_by)

        partner_ids = (
            self.env["account.move"].search(domain, order=order_by).mapped("partner_id")
        )
        for partner in partner_ids:
            customer_data[partner] = invoices.filtered(
                lambda inv: inv.partner_id == partner
            )

        # Calculate total pending amount from all invoices.
        amount_total = sum([inv.amount_residual for inv in invoices])

        data.update({"customer_data": customer_data, "amount_total": amount_total})
        return {
            "doc_ids": docids,
            "doc_model": "invoice.outstanding",
            "docs": self.env["invoice.outstanding"].browse(docids),
            "data": data,
        }
