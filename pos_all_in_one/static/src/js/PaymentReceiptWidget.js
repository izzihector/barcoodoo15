odoo.define('pos_all_in_one.PaymentReceiptWidget', function(require) {
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


    const PaymentReceiptWidget = (ReceiptScreen) => {
        class PaymentReceiptWidget extends ReceiptScreen {
	        constructor() {
	            super(...arguments);
	            this.get_payment_receipt_render_env();
	            if(this.env.pos.config.iface_print_auto)
					{
						self.print_payment();
					}
	        	}

		get_payment_receipt_render_env() {
			var self = this;
			var is_current = this.env.pos.get_order().get_screen_data('is_current_session')
			var is_current_session =  is_current['props']['is_current_session']
			if(is_current_session == true)
			{
				return {
					widget: this,
					pos: this.env.pos,
					payments : is_current['props']['payments'],
					is_current_session:is_current_session,
					pay_summary: this.get_payment_summery(),
					final_total:this.get_payment_final_total(),
					date_pay: (new Date()).toLocaleString(),
					smry_payment : is_current['props']['smry_payment'],
				};

			}
			else{

				return {
					widget: this,
					pos: this.env.pos,
					is_current_session:is_current_session,
					pay_summary: this.get_payment_summery(),
					payments : is_current['props']['payments'],
					final_total:this.get_payment_final_total(),
					smry_payment : is_current['props']['smry_payment'],
					st_date_pay:this.get_payment_st_date(),
					ed_date_pay:this.get_payment_ed_date(),
					st_month_pay:this.get_payment_st_month(),
					ed_month_pay:this.get_payment_ed_month(),
					date_pay: (new Date()).toLocaleString(),
				};
			}

		}

		get_payment_summery(){
			var payment_summary=this.env.pos.get_order().get_screen_data('payment_summary')
			return payment_summary['props']['payment_summary'];
		}

		get_payment_final_total () {
			var final_total=this.env.pos.get_order().get_screen_data('final_total')
			return final_total['props']['final_total'];
		}

		get_payment_st_date (){
			var start_date_pay = this.env.pos.get_order().get_screen_data('start_date_pay')
			var st_date1 = start_date_pay['props']['start_date_pay']
			var st_date = st_date1.split("-")

			var st_date_d = st_date[2];
			var st_date_m = st_date[1];
			var st_date_y = st_date[0];
			var full_st_date = st_date_d+'-'+st_date_m+'-'+st_date_y
			return full_st_date;
		}

		get_payment_ed_date (){
			var end_date_pay = this.env.pos.get_order().get_screen_data('end_date_pay')
			var ed_date1 = end_date_pay['props']['end_date_pay']
			var ed_date = ed_date1.split("-")

			var ed_date_d = ed_date[2];
			var ed_date_m = ed_date[1];
			var ed_date_y = ed_date[0];
			var full_ed_date = ed_date_d+'-'+ed_date_m+'-'+ed_date_y
			return full_ed_date;
		}


		get_payment_st_month(){
			var start_date_pay = this.env.pos.get_order().get_screen_data('start_date_pay')
			var st_date1 = start_date_pay['props']['start_date_pay']
			var st_date = st_date1.split("-")

			var monthNames = ["",
				"January", "February", "March",
				"April", "May", "June", "July",
				"August", "September", "October",
				"November", "December"
			];

			var st_date_m_index = st_date[1];
			var st_date_split = st_date_m_index.split('')

			if(st_date_split[0] > '0'){
				st_date_m_index = st_date_m_index
			}else{
				st_date_m_index = st_date_m_index.split('')[1]
			}
			var st_date_y = st_date[0];

			return monthNames[st_date_m_index]+'-'+st_date_y;
		}

		get_payment_ed_month (){
			var end_date_pay = this.env.pos.get_order().get_screen_data('end_date_pay')
			var ed_date1 = end_date_pay['props']['end_date_pay']
			var ed_date = ed_date1.split("-")

			var monthNames = ["",
				"January", "February", "March",
				"April", "May", "June", "July",
				"August", "September", "October",
				"November", "December"
			];

			var ed_date_m_index = ed_date[1];

			var ed_date_split = ed_date_m_index.split('')
			if(ed_date_split[0] > '0'){
				ed_date_m_index = ed_date_m_index
			}else{
				ed_date_m_index = ed_date_m_index.split('')[1]
			}
			var ed_date_y = ed_date[0];

			return monthNames[ed_date_m_index]+'-'+ed_date_y;
		}

		next_screen(){
			this.showScreen('ProductScreen');
		}


		print_xml() {
			var receipt = QWeb.render('XMLPosPaymentSummaryReceipt', this.get_payment_receipt_render_env());
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

    }
    	PaymentReceiptWidget.template = 'PaymentReceiptWidget';
    	return PaymentReceiptWidget
	};
    Registries.Component.addByExtending(PaymentReceiptWidget,ReceiptScreen);

    return PaymentReceiptWidget;
});