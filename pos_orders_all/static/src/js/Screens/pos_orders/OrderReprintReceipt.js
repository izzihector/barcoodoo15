odoo.define('pos_orders_all.OrderReprintReceipt', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class OrderReprintReceipt extends PosComponent {
		constructor() {
			super(...arguments);
		}
		
		get receiptBarcode(){
			let barcode = this.props.barcode;
			$("#barcode_print1").barcode(
				barcode, // Value barcode (dependent on the type of barcode)
				"code128" // type (string)
			);
		return true
		}
	}
	OrderReprintReceipt.template = 'OrderReprintReceipt';

	Registries.Component.add(OrderReprintReceipt);

	return OrderReprintReceipt;
});
