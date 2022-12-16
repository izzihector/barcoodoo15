odoo.define('pos_orders_all.OpenSOButton', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require('web.custom_hooks');
	const Registries = require('point_of_sale.Registries');

	class OpenSOButton extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}
		async onClick() {
			await this.showTempScreen('SaleOrderScreen');
		}
	}
	OpenSOButton.template = 'OpenSOButton';

	ProductScreen.addControlButton({
		component: OpenSOButton,
		condition: function() {
			return this.env.pos.config.check;
		},
	});

	Registries.Component.add(OpenSOButton);

	return OpenSOButton;
});
