odoo.define('pos_orders_all.SaleOrders', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class SaleOrders extends PosComponent {
		constructor() {
			super(...arguments);
		}

		get highlight() {
			return this.props.order !== this.props.selectedSaleOrder ? '' : 'highlight';
		}
	}
	SaleOrders.template = 'SaleOrders';

	Registries.Component.add(SaleOrders);

	return SaleOrders;
});
