from odoo import models, fields, api, _, Command
from odoo.exceptions import UserError


class ResUsers(models.Model):
    _inherit = 'res.users'

    stock_location_ids = fields.Many2many('stock.location', string="Stock Locations", store=True)
    stock_warehouse_ids = fields.Many2many('stock.warehouse', string="Stock Warehouse", store=True)

    picking_type_ids = fields.Many2many('stock.picking.type', string='Stock Picking Type')


class StockMove(models.Model):
    _inherit = 'stock.move'

    @api.constrains('state', 'location_id', 'location_dest_id')
    def user_location_restriction(self):
        for rec in self:
            if not rec.state == 'draft':
                return True

            user_locations = []
            for i in rec.env.user.stock_location_ids:
                user_locations.append(i.id)

            # user_locations = rec.env.user.stock_location_ids
            if rec.env.user.stock_location_ids:
                message = _(
                    'Invalid Location. You cannot process this move since you do '
                    'not control the location "%s".'
                    'Please contact your Administrator.')

                if rec.location_id.id not in user_locations and self.picking_type_id.code != 'incoming':
                    raise UserError(message % rec.location_id.name)
                elif rec.location_dest_id.id not in user_locations and self.picking_type_id.code != 'outgoing':
                    raise UserError(message % rec.location_dest_id.name)
