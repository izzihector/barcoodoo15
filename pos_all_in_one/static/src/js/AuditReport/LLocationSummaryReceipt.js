odoo.define('pos_all_in_one.LLocationSummaryReceipt', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class LLocationSummaryReceipt extends PosComponent {
		constructor() {
			super(...arguments);
			this.print_location()
		}
		renderElement() {
			var self = this;
			$('#select_ssn').hide();
			$('#select_loc').hide();
		}
		
		print_location(){
			var self = this;
			var select_session = $('.select_session_id').val();
			var location = $('.summery_location_id').val();
			var order = self.env.pos.get_order();
			var summery_product = [];
			var tab1 = $('#tab1').is(':checked')
			var tab2 = $('#tab2').is(':checked')
			$('#select_ssn').hide();
			$('#select_loc').hide();
			var ram = false;
			if(tab1 == true)
			{
				ram = true;
				if(select_session){
					this.rpc({
						model: 'pos.order.location',
						method: 'update_location_summery',
						args: [location, location,select_session,tab1,tab2],
					}).then(function(output_summery_location){
						var summery_loc = output_summery_location;
						self.save_location_summery_details(output_summery_location,ram);
					
					});
				}
				else{
					$('#select_ssn').show();
					setTimeout(function() {$('#select_ssn').hide()},3000);
					$('#tab1').prop('checked', true);
				}
				
			}
			else{
				if(location){
					this.rpc({
						model: 'pos.order.location',
						method: 'update_location_summery',
						args: [location, location,select_session,tab1,tab2],
					}).then(function(output_summery_location){
						var summery_loc = output_summery_location;
						self.save_location_summery_details(output_summery_location,ram);
					
					});
				}
				else{
					$('#select_loc').show();
					setTimeout(function() {$('#select_loc').hide()},3000);
					$('#tab2').prop('checked', true);
				}
			}
		}
		
		save_location_summery_details(output_summery_location,ram){
			var self = this;
			// self.trigger('close-popup');;
			self.get_location_receipt_render_env();
		}

		get_loc_summery(){
			var output_summery_location = this.env.pos.get_order().get_screen_data('output_summery_location')
			return output_summery_location['props']['output_summery_location'];
		}

		get_location_receipt_render_env() {
			var ssn = this.env.pos.get_order().get_screen_data('ssn')
			return {
				widget: this,
				pos: this.env.pos,
				ssn: ssn['props']['ssn'],
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
		
	}
	LLocationSummaryReceipt.template = 'LLocationSummaryReceipt';

	Registries.Component.add(LLocationSummaryReceipt);

	return LLocationSummaryReceipt;
});