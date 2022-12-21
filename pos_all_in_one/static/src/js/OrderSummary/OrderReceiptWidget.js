odoo.define('pos_all_in_one.OrderReceiptWidget', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { useState, useRef, useContext } = owl.hooks;
    const { debounce } = owl.utils;
    const { loadCSS } = require('web.ajax');
    const utils = require('web.utils');
    const { Gui } = require('point_of_sale.Gui');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const Popup = require('point_of_sale.ConfirmPopup');
    var core = require('web.core');
    var QWeb = core.qweb;

    const OrderReceiptWidget = (ReceiptScreen) => {
    	class OrderReceiptWidget extends ReceiptScreen {
	        constructor() {
	            super(...arguments);
	            // this.get_order_receipt_render_env();
	            if(this.env.pos.config.iface_print_auto)
					{
						this.print_order();
					}
	        	}


	        get_order_receipt_render_env() {
				var is_current = this.env.pos.get_order().get_screen_data('order_current_session')
				return {
					widget: this,
					pos: this.env.pos,
					order_current_session :is_current['props']['order_current_session'],
					summery: this.get_summery(),
					st_date:this.get_order_st_date(),
					ed_date:this.get_order_ed_date(),
					date_o: (new Date()).toLocaleString(),
					};
				}


			get_order_st_date(){
				var ord_start_dt = this.env.pos.get_order().get_screen_data('ord_start_dt');
				return ord_start_dt['props']['ord_start_dt'];
						
			}
			get_order_ed_date(){
				var ord_end_dt = this.env.pos.get_order().get_screen_data('ord_end_dt');
				return ord_end_dt['props']['ord_end_dt'];
			}

			get_summery(){
				var output_summery = this.env.pos.get_order().get_screen_data('output_summery');
				return output_summery['props']['output_summery'];
			}
	

    		next_screen(){
			this.showScreen('ProductScreen');
			}

			print_xml() {
				var receipt = QWeb.render('XMLPosOrderSummaryReceipt', this.get_order_receipt_render_env());
				this.pos.proxy.print_receipt(receipt);
			}
			
			print_web() {
				window.print();
			}
			
//			print() {
//				var self = this;
//				if (!this.env.pos.config.iface_print_via_proxy) { // browser (html) printing
//					this.print_web();
//				} else {
//					this.print_xml();
//				}
//			}
			print_order() {
				var self = this;
				if (!this.env.pos.config.iface_print_via_proxy) { // browser (html) printing
					this.print_web();
				} else {
					this.print_xml();
				}
			}
	    }

	    OrderReceiptWidget.template = 'OrderReceiptWidget';
	    return OrderReceiptWidget
	};
    Registries.Component.addByExtending(OrderReceiptWidget,ReceiptScreen);

    return OrderReceiptWidget;

});