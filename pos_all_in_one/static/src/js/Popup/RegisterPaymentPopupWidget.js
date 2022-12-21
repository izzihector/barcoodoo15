odoo.define('pos_all_in_one.RegisterPaymentPopupWidget', function(require) {
	'use strict';

	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');
	const rpc = require('web.rpc');
	let core = require('web.core');
	let _t = core._t;
	// formerly RegisterPaymentPopupWidgetWidget
	class RegisterPaymentPopupWidget extends AbstractAwaitablePopup {

		constructor() {
			super(...arguments);
			console.log("1111111111111111111111111111",this.env.pos.journals)
			this.partner = arguments[1].partner;
		}	

		async register_payment() {
			var self = this;
			var partner = this.partner;
			
			var payment_type = $('#payment_type').val();
			var entered_amount = $("#entered_amount").val();
			var entered_note = $("#entered_note").val();
			let rpc_result = false;

            if (!payment_type) {

				self.showPopup('ErrorPopup', {
					'title': _t('Unknown Payment Type'),
					'body': _t('You cannot Register Payment. Select Payment Type First.'),
				});
				return false;
			}
			
			rpc_result = rpc.query({
				model: 'pos.create.customer.payment',
				method: 'create_customer_payment',
				args: [partner ? partner.id : 0, partner ? partner.id : 0, payment_type, entered_amount, entered_note],

			},{async:false}).then(function(output) {
				alert('Payment has been Registered for this Customer !!!!');
				self.trigger('close-popup');
				self.showScreen('ProductScreen');
			});


		}

		cancel() {
			this.props.resolve({ confirmed: false, payload: null });
			this.trigger('close-popup');
		}
	}

	RegisterPaymentPopupWidget.template = 'RegisterPaymentPopupWidget';
	RegisterPaymentPopupWidget.defaultProps = {
		confirmText: 'Create',
		cancelText: 'Close',
		title: 'Register Payment',
		body: '',
	};

	Registries.Component.add(RegisterPaymentPopupWidget);

	return RegisterPaymentPopupWidget;
});

// 