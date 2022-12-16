odoo.define('pos_all_in_one.XMLPosProductSummaryReceipt', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class XMLPosProductSummaryReceipt extends PosComponent {
		constructor() {
			super(...arguments);
			this.print_product();
			}


			print_product(){
			var self = this;
			var ord_st_date = $('#ord_st_date').val()
			var ord_end_date = $('#ord_end_date').val()
			var pro_st_date = $('#pro_st_date').val()
			var pro_ed_date = $('#pro_ed_date').val()
			var order = this.env.pos.get_order();
			var summery_product = [];
			var curr_session = self.env.pos.config.current_session_id[0];
			var prod_current_session = $('#prod_crnt_ssn').is(':checked')
			$('#prod_dt_strt').hide();
			$('#prod_dt_end').hide();

			if(prod_current_session == true)	
			{
				this.rpc({
						model: 'pos.order',
						method: 'update_product_summery',
						args: [order['sequence_number'], pro_st_date, pro_ed_date,prod_current_session,curr_session],
					})
					.then(function(output_summery_product){
						summery_product = output_summery_product;
						self.save_product_summery_details(output_summery_product, pro_st_date, pro_ed_date,prod_current_session);
					
					});
			}
			else{
				if(ord_st_date == false){
					$('#prod_dt_strt').show()
					setTimeout(function() {$('#prod_dt_strt').hide()},3000);
					return
				}
				else if(ord_end_date == false){
					$('#prod_dt_end').show()
					setTimeout(function() {$('#prod_dt_end').hide()},3000);
					return
				}
				else{
					this.rpc({
						model: 'pos.order',
						method: 'update_product_summery',
						args: [order['sequence_number'], pro_st_date, pro_ed_date,prod_current_session,curr_session],
					})
					.then(function(output_summery_product){
						summery_product = output_summery_product;
						self.save_product_summery_details(output_summery_product, pro_st_date, pro_ed_date,prod_current_session);
					
					});
				}
			}
		}

		save_product_summery_details(output_summery_product, pro_st_date, pro_ed_date,prod_current_session){
			var self = this;
			// self.trigger('close-popup');
			// self.showScreen('ProductReceiptWidget',{output_summery_product:output_summery_product, pro_st_date:pro_st_date, pro_ed_date:pro_ed_date,prod_current_session:prod_current_session});
			self.get_product_receipt_render_env();
		}



		get_pro_summery(){
			var output_summery_product = this.env.pos.get_order().get_screen_data('output_summery_product')
			return output_summery_product['props']['output_summery_product'];
			}
		
		get_product_st_date(){
			var pro_st_date = this.env.pos.get_order().get_screen_data('pro_st_date')
			return pro_st_date['props']['pro_st_date'];
			
		}
		get_product_ed_date(){
			var pro_ed_date = this.env.pos.get_order().get_screen_data('pro_ed_date')
			return pro_ed_date['props']['pro_ed_date'];

		}

		get_product_receipt_render_env() {
			var is_current = this.env.pos.get_order().get_screen_data('prod_current_session')
			return {
				widget: this,
				pos: this.pos,
				prod_current_session : is_current['props']['prod_current_session'],
				p_summery: this.get_pro_summery(),
				p_st_date: this.get_product_st_date(),
				p_ed_date: this.get_product_ed_date(),
				date_p: (new Date()).toLocaleString(),
			};
		}


	}
	XMLPosProductSummaryReceipt.template = 'XMLPosProductSummaryReceipt';

	Registries.Component.add(XMLPosProductSummaryReceipt);

	return XMLPosProductSummaryReceipt;
});