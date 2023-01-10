# -*- coding: utf-8 -*-

from odoo import models


class PosSession(models.Model):
    _inherit = 'pos.session'

    def get_closing_control_data(self):
        result = super(PosSession, self).get_closing_control_data()
        if self.config_id.hide_pos_opencashbox:
            if result.get('default_cash_details') and result.get('default_cash_details').get('opening') > 0.0:
                result.get('default_cash_details')['opening'] = 0.0
                result.get('default_cash_details')['amount'] -= self.cash_register_id.balance_start
        return result
