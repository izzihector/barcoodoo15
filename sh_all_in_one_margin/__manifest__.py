# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.
{
    'name': 'All In One Margin',
    'author': 'Softhealer Technologies',
    "license": "OPL-1",
    'website': 'https://www.softhealer.com',
    'support': 'support@softhealer.com',
    'version': '15.0.2',
    'category': 'Extra Tools',
    'summary': """calculate product margin, add margin on sales module, margin on invoice application, margin in quotation app, margin field in sale order, calculate margin amount, get margin percentage Odoo""",
    'description': """This module helps to calculate the margin on Products. Add margin field on sale order and invoice based on cost price and sales price. It shows the total margin amount and margin percentage also.""",
    'depends': ['sale_management', 'account', 'product'],
    'data': [
            'data/product_margin_group.xml',
            'views/product_template.xml',
            'views/sale_order.xml',
            'views/account_invoice.xml',
    ],
    'images': ['static/description/background.png', ],
    'auto_install': False,
    'installable': True,
    'application': True,
    'price': 30,
    'currency': 'EUR',
}
