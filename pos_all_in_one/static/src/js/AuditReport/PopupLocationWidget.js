odoo.define('pos_all_in_one.PopupLocationWidget', function(require) {
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');

	class PopupLocationWidget extends Popup {
		mounted() {
			$('#select_ssn').hide();
			$('#select_loc').hide();
        }

		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
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
			self.trigger('close-popup');;
			self.showScreen('LocationReceiptWidget',{output_summery_location:output_summery_location,ssn:ram});
		}
	}
	
	PopupLocationWidget.template = 'PopupLocationWidget';

	Registries.Component.add(PopupLocationWidget);

	return PopupLocationWidget;

});