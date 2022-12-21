odoo.define('pos_all_in_one.XMLPosOrderSummaryReceipt', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class XMLPosOrderSummaryReceipt extends PosComponent {
		constructor() {
			super(...arguments);
			this.print_order()
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
			self.get_order_receipt_render_env();
			// self.trigger('close-popup');
			// self.showScreen('OrderReceiptWidget',{output_summery:output_summery, ord_start_dt:ord_st_date, ord_end_dt:ord_end_date,order_current_session:order_current_session});
			
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
	
	}
	XMLPosOrderSummaryReceipt.template = 'XMLPosOrderSummaryReceipt';

	Registries.Component.add(XMLPosOrderSummaryReceipt);

	return XMLPosOrderSummaryReceipt;
});
