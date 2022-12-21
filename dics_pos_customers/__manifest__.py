# Copyright © 2022 DataInteger Consultancy Services (<https://www.datainteger.com>)
# @author: DataInteger Consultancy Services (<contact@datainteger.com>)
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0.html).
{
    'name': 'DICS Distribute Customers',
    'version': '15.0.1.0.3',
    'category': 'Point of Sale',
    'author': 'DataInteger Consultancy Services',
    'website': 'https://www.datainteger.com',
    'license': 'LGPL-3',
    'summary': 'Only Load points of sale for POS Customers',
    'images': [],
    'depends': [
        'point_of_sale','hide_menu_user'
    ],
    'data': [
        'views/res_partner_view.xml',
        'views/pos_config_view.xml'
    ],
    'demo': [

    ],
    'assets': {
        'point_of_sale.assets': [
            'dics_pos_customers/static/src/js/models.js',
        ],
        'web.assets_qweb': [
             'dics_pos_customers/static/src/xml/*.xml',
        ],
    },
    'external_dependencies': {
    },
    'support': 'contact@datainteger.com',
    'application': False,
    'installable': True,
    'auto_install': False,
}
