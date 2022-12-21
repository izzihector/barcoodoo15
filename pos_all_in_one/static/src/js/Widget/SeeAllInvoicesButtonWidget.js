odoo.define('pos_all_in_one.SeeAllInvoicesButtonWidget', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');
	let core = require('web.core');
	let _t = core._t;


	class SeeAllInvoicesButtonWidget extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}

		async onClick() {
			var self = this;
			var currentOrder = self.env.pos.get_order()
			const currentClient = currentOrder.get_client();
			const { confirmed, payload: newClient } = await this.showTempScreen(
				'POSInvoiceScreen',
				{ client: currentClient }
			);
			// this.showScreen('');
		}
	}

	SeeAllInvoicesButtonWidget.template = 'SeeAllInvoicesButtonWidget';

	ProductScreen.addControlButton({
		component: SeeAllInvoicesButtonWidget,
		condition: function() {
			return this.env.pos.config.allow_pos_invoice;
		},
	});

	Registries.Component.add(SeeAllInvoicesButtonWidget);

	return SeeAllInvoicesButtonWidget;
});