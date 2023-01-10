odoo.define('hide_pos_opencashbox.DicsproductScreen', function(require){
     'use strict';

     const Chrome = require('point_of_sale.Chrome');
     const BiProductScreen = require('pos_all_in_one.BiProductScreen');
     const Registries = require('point_of_sale.Registries');
     const { Gui } = require('point_of_sale.Gui');


     const DicsproductScreen = (BiProductScreen) =>
        class extends BiProductScreen {
            mounted () {
                let self = this;
                if(!this.env.pos.config.hide_pos_opencashbox && this.env.pos.config.cash_control && this.env.pos.pos_session.state == 'opening_control') {
                    Gui.showPopup('CashOpeningPopup', {notEscapable: true});
                }
                this.env.pos.on('change:selectedClient', this.render, this);
                if(this.show_buttons){
                    $('.control-buttons').show();
                }else{
                    $('.control-buttons').hide();
                }
            }
        };

     Registries.Component.extend(BiProductScreen, DicsproductScreen);
     return BiProductScreen
});
