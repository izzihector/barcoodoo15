odoo.define('pos_all_in_one.ReportPaymentButtonWidget', function(require) {
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

    class ReportPaymentButtonWidget extends ProductScreen {
        constructor() {
            super(...arguments);
            this.payment_summary_func();
        }

        async payment_summary_func(){
            var self = this;
            // this._super();
            self.showPopup('PopupPaymentWidget',{
                'title': 'Payment Summary',
                // 'body':  'Please check if the printer is still connected.'
            });
            // self.showPopup('PopupPaymentWidget');
        }
    }
    ReportPaymentButtonWidget.template = 'ReportPaymentButtonWidget';

    Registries.Component.add(ReportPaymentButtonWidget);

    return ReportPaymentButtonWidget;
});