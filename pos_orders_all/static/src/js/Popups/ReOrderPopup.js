odoo.define('pos_orders_all.ReOrderPopup', function(require) {
	'use strict';

	const { useExternalListener } = owl.hooks;
	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { useState } = owl.hooks;

	class ReOrderPopup extends AbstractAwaitablePopup {
		constructor() {
			super(...arguments);			
		}

		do_reorder(){
			let self = this;
			let selectedOrder = self.env.pos.get_order();
			let orderlines = self.props.orderlines;
			let order = self.props.order;
			let partner_id = false
			let client = false
			if (order && order.partner_id != null){
				partner_id = order.partner_id[0];
				client = self.env.pos.db.get_partner_by_id(partner_id);
			}
			let reorder_products = {};
			let list_of_qty = $('.entered_item_qty');
			$.each(list_of_qty, function(index, value) {
				let entered_item_qty = $(value).find('input');
				let qty_id = parseFloat(entered_item_qty.attr('qty-id'));
				let line_id = parseFloat(entered_item_qty.attr('line-id'));
				let entered_qty = parseFloat(entered_item_qty.val());
				reorder_products[line_id] = entered_qty;
			});
			
			let invalid_prod = false;
			$.each( reorder_products, function( key, value ) {
				orderlines.forEach(function(ol) {
					if(ol.id == key && value > 0){
						let product = self.env.pos.db.get_product_by_id(ol.product_id[0]);
						if(product){
							selectedOrder.add_product(product, {
								quantity: parseFloat(value),
								price: ol.price_unit,
								discount: ol.discount,
							});
						}else{
							invalid_prod = true;
							alert("Please configure Product:( "+ol.product_id[1]+" ) for POS.")
						}
					}
				});
			});
			
			selectedOrder.set_client(client);
			self.props.resolve({ confirmed: true, payload: null });
			self.trigger('close-popup');
			self.trigger('close-temp-screen');
			
		}
	}
	
	ReOrderPopup.template = 'ReOrderPopup';
	Registries.Component.add(ReOrderPopup);
	return ReOrderPopup;
});
