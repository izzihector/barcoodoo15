# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

{
    "name" : "Customer Sales Analysis Report in Odoo",
    "version" : "15.0.0.0",
    "category" : "Sales",
    'summary': 'Print Customer Sales Analysis Monthly Report Projected Sales report Monthly Sales Analysis Customer monthly Analysis Reports customer monthly sales Analysis Reports monthly Sales Analysis Report sales monthly reports Monthly Sales report',
    "description": """
                
    odoo Customer Sales Analysis Monthly Reports sales monthly reports
    odoo customer sales target reports Customer monthly Sales Analysis Report customer sales order analysis reports
    odoo sales Analysis Reports customer sale Analysis Reports
    odoo customer monthly Analysis Reports customer monthly sales Analysis Reports
    odoo monthly reports for sales customer monthly analysis reports for sales odoo
    odoo sales analysis reports customer sales reports
    odoo customer Shows Actual and Projected Sales Monthly Sales Report
    odoo Monthly Sales Analysis Sales Analysis report sales reports
                
                """,
    "author": "BrowseInfo",
    "website" : "https://www.browseinfo.in",
    "price": 12,
    "currency": 'EUR',
    "depends" : ['sale_management','account'],
    "data": [
        'security/ir.model.access.csv',
        'report/customer_sale_analysis_templates.xml',
        'report/report.xml',
        'wizard/customer_sales_analysis_views.xml',
        ],
    "license":'OPL-1',
    "auto_install": False,
    "installable": True,
    "live_test_url":'https://youtu.be/4xkrheSoXJM',
    "images":["static/description/Banner.png"],
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
