odoo.define('pos_all_in_one.POSProduct', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class POSProduct extends PosComponent {
		constructor() {
			super(...arguments);
		}

		get highlight() {
			return this.props.order !== this.props.selectedPosOrder ? '' : 'highlight';
		}
	}
	POSProduct.template = 'POSProduct';

	Registries.Component.add(POSProduct);

	return POSProduct;
});
