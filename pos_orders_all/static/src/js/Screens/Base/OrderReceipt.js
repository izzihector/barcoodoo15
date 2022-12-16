odoo.define('pos_orders_all.BiOrderReceipt', function(require) {
	"use strict";

	const OrderReceipt = require('point_of_sale.OrderReceipt');
	const Registries = require('point_of_sale.Registries');

	const BiOrderReceipt = OrderReceipt => 
		class extends OrderReceipt {
			constructor() {
				super(...arguments);
			}

			get receipt() {
				let order = this.env.pos.get_order();
				let receipt = this.receiptEnv.receipt;
//				console.log('\n\n receipt.......',receipt)
				let disc_type = this.env.pos.config.discount_type;
				if(disc_type == 'fixed'){
					receipt['total_discount'] = order.get_fixed_discount();
				}
				return receipt;
			}
			
			get receiptBarcode(){
				var order = this.env.pos.get_order();
				$("#barcode_print").barcode(
					order.barcode, // Value barcode (dependent on the type of barcode)
					"code128" // type (string)
				);
			return true
			}
		
	};

	Registries.Component.extend(OrderReceipt, BiOrderReceipt);

	return OrderReceipt;
});