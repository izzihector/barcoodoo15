odoo.define('pos_all_in_one.PaymentScreen', function(require) {
	'use strict';

	const PaymentScreen = require('point_of_sale.PaymentScreen');
	const Registries = require('point_of_sale.Registries');
	const session = require('web.session');

	const BiPaymentScreen = PaymentScreen => 
		class extends PaymentScreen {
			constructor() {
				super(...arguments);
			}

			async selectClient() {
				let self = this;
				if (this.currentOrder.is_paying_partial){
					return self.showPopup('ErrorPopup', {
						title: self.env._t('Not Allowed'),
						body: self.env._t('You cannot change customer of draft order.'),
					});
				} else {
					super.selectClient();
				}
			}

			async click_back(){
				let self = this;
				if(this.currentOrder.is_paying_partial){
					const { confirmed } = await this.showPopup('ConfirmPopup', {
						title: self.env._t('Cancel Payment ?'),
						body: self.env._t('Are you sure,You want to Cancel this payment?'),
					});
					if (confirmed) {
						self.env.pos.delete_current_order();
						self.showScreen('ProductScreen');
					}
				}
				else{
					self.showScreen('ProductScreen');
				}
			}

			clickPayLater(){
				let self = this;
				let order = self.env.pos.get_order();
				let orderlines = order.get_orderlines();
				let partner_id = order.get_client();
				if (!partner_id){
					return self.showPopup('ErrorPopup', {
						title: self.env._t('Unknown customer'),
						body: self.env._t('You cannot perform partial payment.Select customer first.'),
					});
				}
				else if(orderlines.length === 0){
					return self.showPopup('ErrorPopup', {
						title: self.env._t('Empty Order'),
						body: self.env._t('There must be at least one product in your order.'),
					});
				}
				else{
					if(order.get_total_with_tax() !== order.get_total_paid() && order.paymentlines.length != 0){
						order.is_partial = true;
						order.amount_due = order.get_due();
						order.set_is_partial(true);
						order.to_invoice = false;
						order.finalized = false;
						self.env.pos.push_single_order(order);
						self.showScreen('ReceiptScreen');						
					}
				}
			}
		}

	Registries.Component.extend(PaymentScreen, BiPaymentScreen);

	return PaymentScreen;

});