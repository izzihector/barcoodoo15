odoo.define('pos_all_in_one.PopupOrderWidget', function(require) {
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');

	class PopupOrderWidget extends Popup {
		mounted() {
            $('#ordr_dt_strt').hide();
			$('#ordr_dt_end').hide();
        }

		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}

		renderElement(){
			$('#ordr_dt_strt').hide();
			$('#ordr_dt_end').hide();
		}

		print_order (){
			var self = this;
			var ord_st_date = $('#ord_st_date').val()
			var ord_end_date = $('#ord_end_date').val()
			var ord_state = $('#ord_state').val()
			var order = self.env.pos.get_order();
			var summery_order = [];
			var curr_session = self.env.pos.config.current_session_id[0];
			var order_current_session = $('#ordr_crnt_ssn').is(':checked')
			$('#ordr_dt_strt').hide();
			$('#ordr_dt_end').hide();
			if(order_current_session == true)	
			{
				this.rpc({
						model: 'pos.order',
						method: 'update_order_summery',
						args: [order['sequence_number'], ord_st_date, ord_end_date, ord_state,curr_session,order_current_session],
				}).then(function(output_summery){
					summery_order = output_summery;
					self.save_summery_details(output_summery, ord_st_date, ord_end_date,order_current_session);
				
				});
			}
			else{
				if(ord_st_date == false){
					$('#ordr_dt_strt').show()
					setTimeout(function() {$('#ordr_dt_strt').hide()},3000);
					return
				}
				else if(ord_end_date == false){
					$('#ordr_dt_end').show()
					setTimeout(function() {$('#ordr_dt_end').hide()},3000);
					return
				}
				else{
					this.rpc({
						model: 'pos.order',
						method: 'update_order_summery',
						args: [order['sequence_number'], ord_st_date, ord_end_date,ord_state,curr_session,order_current_session],
					}).then(function(output_summery){
						summery_order = output_summery;
						self.save_summery_details(output_summery, ord_st_date, ord_end_date,order_current_session);
					
					});
				}
			}
			
		}


		save_summery_details(output_summery, ord_st_date, ord_end_date,order_current_session){
			var self = this;
			self.trigger('close-popup');
			self.showScreen('OrderReceiptWidget',{output_summery:output_summery, ord_start_dt:ord_st_date, ord_end_dt:ord_end_date,order_current_session:order_current_session});
		}
	}

	PopupOrderWidget.template = 'PopupOrderWidget';

	Registries.Component.add(PopupOrderWidget);

	return PopupOrderWidget;

});