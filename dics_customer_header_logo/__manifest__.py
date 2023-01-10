{
    'name': 'DICS Customer Header Logo',
    'version': '15.0.0',
    'description': """
                    IN This Module We Have Added Header Logo field in the Customer,
                    and in the Invoice Report Replaced the Company Logo to Customer Header Logo
                   """
                   ,
    'author': 'DataInteger Consultancy Services LLP',
    'license': 'OPL-1',
    'company': 'DataInteger Consultancy Services LLP',
    'website': 'https://www.datainteger.com',
    'depends': [
        'base',
        'account',
        'customer_statement_knk',
    ],
    'data': [
        'views/res_partner_view.xml',
        'report/invoice_report_inherit.xml',
    ],
    'installable': True,
    'auto_install': False,
    'auto_install': False,
}
