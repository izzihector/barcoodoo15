odoo.define('pos_all_in_one.PosInternalStockPopupWidget', function(require) {
	'use strict';

	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');
	const rpc = require('web.rpc');
	let core = require('web.core');
	let _t = core._t;
	// formerly PosInternalStockPopupWidgetWidget
	class PosInternalStockPopupWidget extends AbstractAwaitablePopup {

		constructor() {
			super(...arguments);
		}	

		create_transfer() {
			var self = this;

			var order = this.env.pos.get_order();
			var orderlines = order.get_orderlines();

			var picking_type = $('.drop-type').val();
			var src = $('.drop-src').val();
			var dest = $('.drop-dest').val();
			var state = $('.drop-state').val();
			if (self.env.pos.get_client()){
				var client = self.env.pos.get_client().id;
			}
			else{
				var client = false;
			}
			if(!picking_type || !src || !dest || !state){
				alert("Please select all options");
			}
			else if(parseInt(src) == parseInt(dest)){
				alert("You can not choose  same location as source location and destination location");
			}
			else{
				if(orderlines.length!=0){
					var product_ids = []
					for(var i=0;i<orderlines.length;i++){
						var prod_exist = $.grep(product_ids, function(v) {
							return v.product_id === orderlines[i].product.id;
						});
						if(prod_exist.length!=0){
							prod_exist[0]['quantity'] += orderlines[i].quantity
						}
						else{
							product_ids.push({
								'product_id': orderlines[i].product.id,
								'quantity': orderlines[i].quantity
							});
						}
					}

					rpc.query({
						model: 'pos.session',
						method: 'checking_product',
						args: [1,product_ids],
					}).then(function(output) {
						if(output[1].length!=0){
							var product;
							var name_product= '';
							for (var i = 0; i<output[1].length; i++)
							{
								product = self.env.pos.db.get_product_by_id(output[1][i])
								name_product += product.display_name+','
							}
							alert(name_product+"Product are serviceable so picking not generate for this products.")
						}
						if(output[0].length!=0){
							rpc.query({
								model: 'pos.session',
								method: 'generate_internal_picking',
								args: [1,client,picking_type,src,dest,state,product_ids],
							}).then(function(output) {
								if(output){
									alert("Your picking generated , Picking number is : "+output)
									product_ids = []
									if(orderlines.length > 0){
										for (var line in orderlines)
										{
											order.remove_orderline(order.get_orderlines());
										}
									}
									order.set_client(false)
									self.trigger('close-popup');
								}
							});
						}
					});
				}else{
					alert("Please Select Product first.")
				}
			}
		}

		cancel() {
			this.props.resolve({ confirmed: false, payload: null });
			this.trigger('close-popup');
		}
	}

	PosInternalStockPopupWidget.template = 'PosInternalStockPopupWidget';
	PosInternalStockPopupWidget.defaultProps = {
		confirmText: 'Create Transfer',
		cancelText: 'Close',
		title: 'Internal Stock Transfer',
		body: '',
	};

	Registries.Component.add(PosInternalStockPopupWidget);

	return PosInternalStockPopupWidget;
});

// 