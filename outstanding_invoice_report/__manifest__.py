# -*- coding: utf-8 -*-
# Part of Odoo, Aktiv Software PVT. LTD.
# See LICENSE file for full copyright & licensing details.

# Author: Aktiv Software PVT. LTD.
# mail: odoo@aktivsoftware.com
# Copyright (C) 2015-Present Aktiv Software PVT. LTD.
# Contributions:
#   Aktiv Software:
#       - Aarti Sathvara
#       - Burhan Vakharia
#       - Tanvi Gajera
{
    "name": "Outstanding Invoice Report",
    "website": "http://www.aktivsoftware.com",
    "author": "Aktiv Software",
    "category": "Accounting",
    "summary": """Generate report for customer/vendor outstanding Invoice.
    customer invoice,
    customer invoice report,
    customer invoice statement,
    supplier invoice statement,
    supplier inovice report,
    supplier inovice,
    vendor invoice statement,
    vendor inovice report,
    vendor inovice,
    customer balance,
    vendor balance,
    customer statement,
    vendor statement,
    supplier statement,
    supplier statement,
    """,
    "license": "OPL-1",
    "description": """
    Generate report for customer/vendor outstanding Invoice. User can also
    generate report for specific customers/vendors.
    """,
    "version": "15.0.1.0.0",
    "depends": ["account"],
    "price": 8.00,
    "currency": "EUR",
    "data": [
        "security/ir.model.access.csv",
        "wizard/invoice_outstanding.xml",
        "views/invoice_outstanding_report_view.xml",
        "report/invoice_outstanding_template.xml",
        "report/invoice_outstanding_report.xml",
    ],
    "images": ["static/description/banner.png"],
    "auto_install": False,
    "installable": True,
    "application": False,
}
