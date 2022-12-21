from odoo import fields,api,models

class PosConfig(models.Model):
    _inherit = 'pos.config'

    pos_logo = fields.Image(string="Pos Logo")