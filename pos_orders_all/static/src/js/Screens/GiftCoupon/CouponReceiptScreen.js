
odoo.define('pos_orders_all.CouponReceiptScreen', function(require) {
	'use strict';

	const ReceiptScreen = require('point_of_sale.ReceiptScreen');
	const Registries = require('point_of_sale.Registries');

	const CouponReceiptScreen = (ReceiptScreen) => {
		class CouponReceiptScreen extends ReceiptScreen {
			constructor() {
				super(...arguments);
			}

			back() {
				this.trigger('close-temp-screen');
				this.showScreen('ProductScreen');
			}
		}
		CouponReceiptScreen.template = 'CouponReceiptScreen';
		return CouponReceiptScreen;
	};

	Registries.Component.addByExtending(CouponReceiptScreen, ReceiptScreen);
	return CouponReceiptScreen;
});