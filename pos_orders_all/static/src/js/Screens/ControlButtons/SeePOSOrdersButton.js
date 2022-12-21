odoo.define('pos_orders_all.SeePOSOrdersButton', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require('web.custom_hooks');
	const Registries = require('point_of_sale.Registries');

	class SeePOSOrdersButton extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}
		async onClick() {
			await this.showTempScreen('POSOrdersScreen', {
				'selected_partner_id': false 
			});
		}
	}
	SeePOSOrdersButton.template = 'SeePOSOrdersButton';

	ProductScreen.addControlButton({
		component: SeePOSOrdersButton,
		condition: function() {
			return this.env.pos.config.show_order;
		},
	});

	Registries.Component.add(SeePOSOrdersButton);

	return SeePOSOrdersButton;
});
