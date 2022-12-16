odoo.define('pos_all_in_one.RegisterInvoicePaymentPopupWidget', function(require) {
	'use strict';

	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');
	const rpc = require('web.rpc');
	let core = require('web.core');
	let _t = core._t;
	// formerly RegisterInvoicePaymentPopupWidgetWidget
	class RegisterInvoicePaymentPopupWidget extends AbstractAwaitablePopup {

		constructor() {
			super(...arguments);
			this.invoice = arguments[1].invoice;
		}	

		async register_payment() {
			var self = this;
			var invoice = this.invoice;
			var partner = invoice.partner_id[0];
			var payment_type = $('#payment_type1').val();
			var entered_amount = $("#entered_amount1").val();
			var entered_note = $("#entered_note1").val();
			let rpc_result = false;

			if (invoice['amount_residual'] >= entered_amount){
				rpc_result = rpc.query({
					model: 'pos.create.customer.payment',
					method: 'create_customer_payment_inv',
					args: [partner ? partner : 0, partner ? partner : 0, payment_type, entered_amount, invoice, entered_note],
					
				}).then(function(output) {
					alert('Payment has been Registered for this Invoice !!!!');
					self.trigger('close-popup');
					self.showScreen('ProductScreen');
				});

				
			}else{
				self.showPopup('ErrorPopup', {
					'title': _t('Amount Error'),
					'body': _t('Entered amount is larger then due amount. please enter valid amount'),
				});
			}

		}

		cancel() {
			this.props.resolve({ confirmed: false, payload: null });
			this.trigger('close-popup');
		}
	}

	RegisterInvoicePaymentPopupWidget.template = 'RegisterInvoicePaymentPopupWidget';
	
	RegisterInvoicePaymentPopupWidget.defaultProps = {
		confirmText: 'Create',
		cancelText: 'Close',
		title: 'Register Payment for the Invoice & Validate',
		body: '',
	};

	Registries.Component.add(RegisterInvoicePaymentPopupWidget);

	return RegisterInvoicePaymentPopupWidget;
});

// 