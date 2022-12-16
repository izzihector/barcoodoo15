
odoo.define('pos_all_in_one.PopupProductWidget', function(require) {
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');

	class PopupProductWidget extends Popup {

		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}

		mounted(){
			$('#prod_dt_strt').hide();
			$('#prod_dt_end').hide();			
		}
		renderElement() {
			var self = this;
			$('#prod_dt_strt').hide();
			$('#prod_dt_end').hide();

			$('#prod_crnt_ssn').click(function() {
				if ($('#prod_crnt_ssn').is(':checked')) {
					$('#prod_st_dt').hide();
					$('#prod_end_dt').hide();
				}
				else{
					$('#prod_st_dt').show();
					$('#prod_end_dt').show();
				}
			});

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
				if(!pro_st_date){
					$('#prod_dt_strt').show()
					setTimeout(function() {$('#prod_dt_strt').hide()},3000);
					return
				}
				else if(!pro_ed_date){
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
			self.trigger('close-popup');
			self.showScreen('ProductReceiptWidget',{output_summery_product:output_summery_product, pro_st_date:pro_st_date, pro_ed_date:pro_ed_date,prod_current_session:prod_current_session});
		}
	}

	PopupProductWidget.template = 'PopupProductWidget';

	Registries.Component.add(PopupProductWidget);

	return PopupProductWidget;

});