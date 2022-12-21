odoo.define('pos_orders_all.POSOrders', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class POSOrders extends PosComponent {
		constructor() {
			super(...arguments);
		}

		get highlight() {
			return this.props.order !== this.props.selectedPosOrder ? '' : 'highlight';
		}
	}
	POSOrders.template = 'POSOrders';

	Registries.Component.add(POSOrders);

	return POSOrders;
});
