
odoo.define('pos_all_in_one.ReportLocationButtonWidget', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { useState, useRef, useContext } = owl.hooks;
    const { debounce } = owl.utils;
    const { loadCSS } = require('web.ajax');
    const utils = require('web.utils');
    const { Gui } = require('point_of_sale.Gui');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const Popup = require('point_of_sale.ConfirmPopup');
    // var QWeb = core.qweb;

    class ReportLocationButtonWidget extends ProductScreen {
        constructor() {
            super(...arguments);
            this.button_click();
        }
            
        async button_click(){
            var self = this;
            // this._super();
            self.showPopup('PopupLocationWidget',{
                'title': 'Audit Report',
                // 'body':  'Please check if the printer is still connected.'
            });
            // self.showPopup('PopupPaymentWidget');            
        }
    }
    ReportLocationButtonWidget.template = 'ReportLocationButtonWidget';

    Registries.Component.add(ReportLocationButtonWidget);

    return ReportLocationButtonWidget;
});