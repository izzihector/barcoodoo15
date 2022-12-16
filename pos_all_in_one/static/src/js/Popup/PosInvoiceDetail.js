odoo.define('pos_all_in_one.PosInvoiceDetail', function(require) {
	'use strict';

	const { useExternalListener } = owl.hooks;
	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { useState } = owl.hooks;

	const rpc = require('web.rpc');
	let core = require('web.core');
	let _t = core._t;

	class PosInvoiceDetail extends AbstractAwaitablePopup {
		constructor() {
			super(...arguments);
			this.invoice = arguments[1].order;
		}

		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}

		async register_payment() {
			var self = this;
			var invoice = this.invoice;
			self.showPopup('RegisterInvoicePaymentPopupWidget', {'invoice':this.invoice});
		}
	}
	
	PosInvoiceDetail.template = 'PosInvoiceDetail';
	Registries.Component.add(PosInvoiceDetail);
	return PosInvoiceDetail;
});
