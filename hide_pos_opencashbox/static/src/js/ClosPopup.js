odoo.define('hide_pos_opencashbox.ClosePosPopup', function(require){
     'use strict';

     const ClosePosPopup = require('point_of_sale.ClosePosPopup');
     const Registries = require('point_of_sale.Registries');
     

     const HideCashBoxClosePosPopup = (ClosePosPopup) =>
        class extends ClosePosPopup {
            hasUserAuthority() {
                return !this.env.pos.config.hide_pos_opencashbox && super.hasUserAuthority();
            }
        };

     Registries.Component.extend(ClosePosPopup, HideCashBoxClosePosPopup);
     return ClosePosPopup
});
