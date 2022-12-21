
odoo.define('pos_all_in_one.LocationReceiptWidget', function(require) {
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
    var core = require('web.core');
    var QWeb = core.qweb;

	class LocationReceiptWidget extends PosComponent {
		constructor() {
            super(...arguments);
            this.get_location_receipt_render_env();
			if(this.env.pos.config.iface_print_auto)
			{
				self.print();
			}
        }

  		next_screen(){
			this.showScreen('ProductScreen');
		}

		get_loc_summery(){
			return this['props']['output_summery_location'];
		}

		get_location_receipt_render_env() {
			return {
				widget: this,
				pos: this.pos,
				ssn: this['props']['ssn'],
				loc_summery: this.get_loc_summery(),
				date: (new Date()).toLocaleString()

			};
		}
		location_render_reciept(){
			$('.location-receipt').html(QWeb.render('LLocationSummaryReceipt', this.get_location_receipt_render_env()));
		}
		
		print_xml() {
			var receipt = QWeb.render('LLocationSummaryReceipt', this.get_location_receipt_render_env());
			this.pos.proxy.print_receipt(receipt);
		}
		
		print_web() {
			window.print();
		}
		
		print() {
			var self = this;
			if (!this.env.pos.config.iface_print_via_proxy) { // browser (html) printing
				this.print_web();
			} else {    
				this.print_xml();
			}
		}
		
		renderElement() {
			var self = this;
			
			$('.next').click(function(){
				self.gui.show_screen('products');
			});
			
			$('.button.print-loc').click(function(){
				self.print();
			});
			
		}

	}

	LocationReceiptWidget.template = 'LocationReceiptWidget';

	Registries.Component.add(LocationReceiptWidget);

	return LocationReceiptWidget;
});