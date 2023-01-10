odoo.define('hide_pos_opencashbox.HideCashBox', function(require){
     'use strict';

     const Chrome = require('point_of_sale.Chrome');
     const Registries = require('point_of_sale.Registries');

     const HideCashBoxChrome = (Chrome) =>
        class extends Chrome {
            shouldShowCashControl() {
                return !this.env.pos.config.hide_pos_opencashbox && super.shouldShowCashControl();
            }
        };

     Registries.Component.extend(Chrome, HideCashBoxChrome);
     return Chrome
});
