# -*- coding: UTF-8 -*-
# Part of Softhealer Technologies.
{
    "name": "Analytic Journal",
    "author": "Softhealer Technologies",
    "website": "https://www.softhealer.com",
    "support": "support@softhealer.com",
    "category": "Accounting",
    "license": "OPL-1",
    "summary": """
Link Analytic Account, Configure Analytic Account, Set Analytic Tags App,
Analytic Journal Items, Analytic Journal Entries, Analytics Account,
Analytic Tags Odoo
""",
    "description": """
This module helps to configure 'Analytic Account' &
'Analytic Tags' in the invoice. You can set an analytic account and
analytic tags in the manual payment also. It automatically passes
into the journal entries & journal items.
Analytic Journal Odoo
Link Analytic Account Module, Configure Analytic Account, Set Analytic Tags,
Analytic Account To Journal Items, Analytic Account In Journal Entries,
Analytics Account Odoo
Link Analytic Account, Configure Analytic Account, Set Analytic Tags App,
Analytic Journal Items, Analytic Journal Entries, Analytics Account,
Analytic Tags Odoo
""",
    "version": "15.0.1",
    "depends": [
        "account"
    ],
    "data": [
        "security/analytic_journal_security.xml",
        "views/account_payment_register.xml",
        "views/account_payment.xml",
    ],
    "images": ["static/description/background.png", ],
    "live_test_url": "https://youtu.be/6eChcIiUXfY",
    "application": True,
    "auto_install": False,
    "installable": True,
    "price": 35,
    "currency": "EUR"
}
