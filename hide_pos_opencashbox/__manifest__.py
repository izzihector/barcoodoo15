# -*- coding: utf-8 -*-
{
    'name': "Hide Pos Opening Cash Controll",

    'summary': """Hide Pos Opening Cash Controll""",

    'description': """
        Hide Pos Opening Cash Controll
    """,

    'company': 'DataInteger Consultancy Services LLP',
    'website': 'https://www.datainteger.com',
	"license": "OPL-1",
    'category': 'Sales/Point of Sale',
    'version': '15.0.0',

    'depends': [
        'point_of_sale'
    ],

    'data': [
        'views/pos_config.xml',
    ],

    'assets': {
        'point_of_sale.assets': [
            'hide_pos_opencashbox/static/src/js/HideCashBoxChrome.js',
        ],
    },

    'installable': True,
}
