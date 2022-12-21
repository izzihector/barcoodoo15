odoo.define('pos_orders_all.GiftCouponButton', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require('web.custom_hooks');
	const Registries = require('point_of_sale.Registries');

	class GiftCouponButton extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}
		async onClick() {
			this.showPopup('CouponConfigPopup',{});
		}
	}
	GiftCouponButton.template = 'GiftCouponButton';

	ProductScreen.addControlButton({
		component: GiftCouponButton,
		condition: function() {
			return true;
		},
	});

	Registries.Component.add(GiftCouponButton);

	return GiftCouponButton;
});
