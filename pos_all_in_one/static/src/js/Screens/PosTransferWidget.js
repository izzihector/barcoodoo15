odoo.define('pos_all_in_one.PosTransferWidget', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require('web.custom_hooks');
	let core = require('web.core');
	let _t = core._t;
	const Registries = require('point_of_sale.Registries');

	class PosTransferWidget extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}

		onClick() {
			var self = this;
			self.showPopup('PosInternalStockPopupWidget', {});
		}
	}

	PosTransferWidget.template = 'PosTransferWidget';

	ProductScreen.addControlButton({
		component: PosTransferWidget,
		condition: function() {
			return this.env.pos.config.internal_transfer;
		},
	});

	Registries.Component.add(PosTransferWidget);

	return PosTransferWidget;
});