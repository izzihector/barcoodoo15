odoo.define('pos_all_in_one.SeeAllProductsButtonWidget', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');
	let core = require('web.core');
	let _t = core._t;


	class SeeAllProductsButtonWidget extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}

		async onClick() {
			await this.showTempScreen('POSProductScreen', {
				'selected_partner_id': false 
			});
		}
	}

	SeeAllProductsButtonWidget.template = 'SeeAllProductsButtonWidget';

	ProductScreen.addControlButton({
		component: SeeAllProductsButtonWidget,
		condition: function() {
			return this.env.pos.config.allow_pos_product_operations;
		},
	});

	Registries.Component.add(SeeAllProductsButtonWidget);

	return SeeAllProductsButtonWidget;
});