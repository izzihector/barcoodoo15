odoo.define('pos_orders_all.SODetail', function(require) {
	'use strict';

	const Registries = require('point_of_sale.Registries');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');

	class SODetail extends AbstractAwaitablePopup {
		constructor() {
			super(...arguments);
		}
	}
	
	SODetail.template = 'SODetail';
	Registries.Component.add(SODetail);
	return SODetail;
});
