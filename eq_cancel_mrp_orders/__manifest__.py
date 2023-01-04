# -*- coding: utf-8 -*-
##############################################################################
#
# Copyright 2019 EquickERP
#
##############################################################################
{
    'name': "Cancel Manufacturing Order",
    'category': 'Manufacturing',
    'version': '15.0.1.0',
    'author': 'Equick ERP',
    'description': """
        This Module allows user to cancel done manufacturing orders and reset to draft manufacturing orders.
        * Allows you to cancel Done manufacturing order.
        * Allows you to Reset to Draft cancel manufacturing order.
        * Cancel done stock move and reverse the inventory in system.
        * Cancel finished work orders.
        * Cancel scrap orders.
    """,
    'summary': """This Module allows user to cancel manufacturing order. mo cancel | cancel manufacturing | cancel mrp | reset mrp | reset manufacturing | resert mo | mo order cancel | mrp cancel | cancel mo | cancel and reset mrp | cancel and reset mo""",
    'depends': ['mrp'],
    'price': 25,
    'currency': 'EUR',
    'license': 'OPL-1',
    'website': "",
    'data': [
        'security/security.xml',
        'views/mrp_production_view.xml',
    ],
    'images': ['static/description/main_screenshot.png'],
    'installable': True,
    'auto_install': False,
    'application': False,
}

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
