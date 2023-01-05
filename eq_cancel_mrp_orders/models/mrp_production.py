# -*- coding: utf-8 -*-
##############################################################################
#
# Copyright 2019 EquickERP
#
##############################################################################

from odoo import models, fields
from odoo.addons.mrp.models.stock_move import StockMove
from odoo.addons.mrp.models.mrp_workorder import MrpWorkorder


class mrp_production(models.Model):
    _inherit = 'mrp.production'

    def action_cancel(self):
        for production in self:
            finish_moves = production.move_finished_ids.filtered(lambda x: x.state != 'cancel')
            raw_moves = production.move_raw_ids.filtered(lambda x: x.state != 'cancel')
            production.get_prodution_scrap_moves()
            production.cancel_mrp_moves(raw_moves + finish_moves)
            picking_ids = production.picking_ids.filtered(lambda x: x.state != 'cancel')
            picking_moves = picking_ids.mapped('move_lines')
            production.cancel_mrp_moves(picking_moves)
            production.workorder_ids.filtered(lambda x: x.state != 'cancel').action_cancel()
        return super(mrp_production, self).action_cancel()

    def cancel_mrp_moves(self, moves):
        quant_obj = self.env['stock.quant']
        move_fields = self.env['stock.move']._fields.keys()
        for eachmove in moves:
            if eachmove.product_id.type == 'product' and eachmove.state == 'done':
                for sm_line in eachmove.move_line_ids:
                    line_qty = sm_line.product_uom_id._compute_quantity(sm_line.qty_done, sm_line.product_id.uom_id)
                    quant_obj._update_available_quantity(sm_line.product_id, sm_line.location_id, line_qty, lot_id=sm_line.lot_id, package_id=sm_line.package_id, owner_id=sm_line.owner_id)
                    quant_obj._update_available_quantity(sm_line.product_id, sm_line.location_dest_id, line_qty * -1, lot_id=sm_line.lot_id, package_id=sm_line.package_id, owner_id=sm_line.owner_id)
            if eachmove.procure_method == 'make_to_order' and not eachmove.move_orig_ids:
                eachmove.state = 'waiting'
            elif eachmove.move_orig_ids and not all(orig.state in ('done', 'cancel') for orig in eachmove.move_orig_ids):
                eachmove.state = 'waiting'
            else:
                eachmove.state = 'confirmed'
            if eachmove.scrap_ids:
                eachmove.state = 'draft'

            if 'account_move_ids' in move_fields:
                eachmove.account_move_ids.button_cancel()
                eachmove.account_move_ids.with_context(force_delete=True).unlink()
            # eachmove.quantity_done = 0.00

    def get_prodution_scrap_moves(self):
        scrap_order_ids = self.scrap_ids.filtered(lambda x: x.state == 'done' and x.move_id)
        scrap_moves = scrap_order_ids.mapped('move_id')
        self.cancel_mrp_moves(scrap_moves)
        scrap_order_ids.write({'state':'cancel'})
        scrap_moves.sudo().unlink()

    def action_reset_to_draft(self):
        for production in self:
            production.qty_producing = 0.00
            move_raw_ids = production.move_raw_ids.filtered(lambda x: x.state == 'cancel').sudo()
            move_raw_ids.write({'state':'draft'})
            move_raw_ids.unlink()
            move_finished_ids = production.move_finished_ids.filtered(lambda x: x.state == 'cancel').sudo()
            move_finished_ids.write({'state':'draft'})
            move_finished_ids.unlink()
            production.state = 'draft'
            production._onchange_product_id()
            production._onchange_producing()
            production._onchange_product_qty()
            production._onchange_bom_id()
            production._onchange_date_planned_start()
            production._onchange_move_raw()
            production._onchange_move_finished()
            production._onchange_picking_type()
            production.scrap_ids.filtered(lambda x: x.state == 'cancel').sudo().unlink()
            production.workorder_ids.filtered(lambda x: x.state == 'cancel').sudo().unlink()
            production.picking_ids.filtered(lambda x: x.state == 'cancel').sudo().unlink()
            production._onchange_workorder_ids()


class stock_move(models.Model):
    _inherit = 'stock.move'

    def _action_cancel(self):
        return super(StockMove, self)._action_cancel()

    StockMove._action_cancel = _action_cancel


class stock_scrap(models.Model):
    _inherit = 'stock.scrap'

    state = fields.Selection(selection_add=[('cancel', 'Cancel')])


class mrp_workorder(models.Model):
    _inherit = 'mrp.workorder'

    def write(self, values):
        return super(MrpWorkorder, self).write(values)

    MrpWorkorder.write = write

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: