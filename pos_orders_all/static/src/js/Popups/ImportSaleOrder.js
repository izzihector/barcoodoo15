odoo.define('pos_orders_all.ImportSaleOrder', function(require) {
	'use strict';

	const { useExternalListener } = owl.hooks;
	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { useState } = owl.hooks;

	class ImportSaleOrder extends AbstractAwaitablePopup {
		constructor() {
			super(...arguments);		
		}

		do_import(){
			let self = this;
			let selectedOrder = self.env.pos.get_order();
			let orderlines = self.props.orderlines;
			let order = self.props.order;
			let imported = false;
			let partner_id = false
			let client = false
			if (order && order.partner_id != null){
				partner_id = order.partner_id[0];
				client = self.env.pos.db.get_partner_by_id(partner_id);
			}
			let import_products = {};
			let list_of_qty = $('.entered_item_qty');
			$.each(list_of_qty, function(index, value) {
				let entered_item_qty = $(value).find('input');
				let qty_id = parseFloat(entered_item_qty.attr('qty-id'));
				let line_id = parseFloat(entered_item_qty.attr('line-id'));
				let entered_qty = parseFloat(entered_item_qty.val());
				import_products[line_id] = entered_qty;
			});
			
			$.each( import_products, function( key, value ) {
				orderlines.forEach(function(ol) {
					if(ol.id == key && value > 0){
						let product = self.env.pos.db.get_product_by_id(ol.product_id[0]);
						if(product){
							selectedOrder.add_product(product, {
								quantity: parseFloat(value),
								price: ol.price_unit,
								discount: ol.discount,
							});
							selectedOrder.set_client(client);
							imported = true;
						}else{
							alert("please configure product for point of sale.");
							return;
						}
					}
				});
			});
			if(imported){
				selectedOrder.set_imported_sales(order.id);
			}

			self.props.resolve({ confirmed: true, payload: null });
			self.trigger('close-popup');
			self.trigger('close-temp-screen');
		}
	}
	
	ImportSaleOrder.template = 'ImportSaleOrder';
	Registries.Component.add(ImportSaleOrder);
	return ImportSaleOrder;
});
