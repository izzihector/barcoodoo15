odoo.define('pos_all_in_one.PayPOSOrdersScreen', function (require) {
	'use strict';

	const POSOrdersScreen = require('pos_orders_all.POSOrdersScreen');
	const Registries = require('point_of_sale.Registries');
	const {useState} = owl.hooks;
	const {useListener} = require('web.custom_hooks');

	const PayPOSOrdersScreen = (POSOrdersScreen) =>
		class extends POSOrdersScreen {
			constructor() {
				super(...arguments);
				this.filter_state = '';
				this.state = {
					filter_state: this.filter_state,
				};
				useListener('click-pay', this.clickPay);
			}

			changeFilter(state){
				let self = this;
				if(state == 'draft'){
					this.state.filter_state  = 'Unpaid/Draft';
				}else if(state == 'paid'){
					this.state.filter_state  = 'Paid';
				}else if(state == 'done'){
					this.state.filter_state  = 'Posted';
				}else if(state == 'invoiced'){
					this.state.filter_state  = 'Invoiced';
				}else{
					this.state.filter_state  = '';
				}
				this.state.query = state;
				const pos_orders = this.pos_orders;
				this.render();
			}

			refresh_orders(){
				$('.input-search-orders').val('');
				this.state.query = '';
				this.props.selected_partner_id = false;
				this.state.filter_state  = '';
				this.render();
			}

			remove_current_orderlines(){
				let self = this;
				let order = self.env.pos.get_order();
				let orderlines = order.get_orderlines();
				if(orderlines.length > 0){
					for (let line in orderlines)
					{
						order.remove_orderline(order.get_orderlines());
					}
				} 
			}

			async clickPay(event){
				let self = this;
				let old_order = self.env.pos.get_order();
				let order = event.detail;
				let o_id = parseInt(event.detail.id);
				let orderlines = [];
				$.each(order.lines, function(index, value) {
					let ol = self.env.pos.db.get_orderline_by_id[value];
					orderlines.push(ol);
				});	
				self.remove_current_orderlines();
				if(orderlines.length > 0){
					old_order.name = order.pos_reference;
					old_order.is_partial = order.is_partial;
					old_order.amount_due = order.amount_due;
					old_order.barcode = order.barcode;
					old_order.barcode_img = order.barcode_img;
					old_order.is_paying_partial = true;
					old_order.amount_paid  = order.amount_paid;
				}

				if (order.partner_id) {
					let client = self.env.pos.db.get_partner_by_id(order.partner_id[0]);
					old_order.set_client(client);
				}

				orderlines.forEach(function(ol) {
					let product = self.env.pos.db.get_product_by_id(ol.product_id[0]);
					old_order.add_product(product, {
						quantity: parseFloat(ol.qty),
						price: ol.price_unit,
						discount: ol.discount,
					});
				});

				if(order.amount_due > 0 && order.amount_paid != 0)
				{
					let product_for_due = self.env.pos.config.partial_product_id;
					if(product_for_due)
					{
						let prd = self.env.pos.db.get_product_by_id(product_for_due[0]);
						old_order.add_product(prd,{
							quantity: 1.0,
							price: -order.amount_paid,
							discount: 0
						});
					}
					else{
						return self.showPopup('ErrorPopup', {
							title: self.env._t('Configure Product'),
							body: self.env._t('Please configure partial product.'),
						});
					}
				}
				if(old_order.orderlines.length > 0){
					self.trigger('close-temp-screen');
					self.showScreen('PaymentScreen');			
				}
			}

		}
		
	Registries.Component.extend(POSOrdersScreen, PayPOSOrdersScreen);

	return POSOrdersScreen;
});


