from odoo import fields, api, models


class ResPartner(models.Model):
    _inherit = 'res.partner'

    header_logo = fields.Binary(string="Header Logo")

