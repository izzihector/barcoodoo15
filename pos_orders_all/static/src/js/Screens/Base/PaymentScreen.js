odoo.define('pos_orders_all.PaymentScreen', function(require) {
	'use strict';

	const PaymentScreen = require('point_of_sale.PaymentScreen');
	const Registries = require('point_of_sale.Registries');
	const session = require('web.session');

	const BiPaymentScreen = PaymentScreen => 
		class extends PaymentScreen {
			constructor() {
				super(...arguments);
				if(this.env.pos.config.auto_check_invoice){
					this.currentOrder.set_to_invoice(true);
				}
			}

			async _finalizeValidation() {
				if (this.currentOrder.is_paid_with_cash() && this.env.pos.config.iface_cashdrawer) {
					this.env.pos.proxy.printer.open_cashbox();
				}

				this.currentOrder.initialize_validation_date();
				this.currentOrder.finalized = true;

				let syncedOrderBackendIds = [];
				let credit_note = this.env.pos.config.credit_note;
				let total =  this.currentOrder.get_total_with_tax();
				try {
					if (this.currentOrder.is_to_invoice()) {
						if((total >= 0) || (total < 0 && credit_note != "not_create_note")){
							syncedOrderBackendIds = await this.env.pos.push_and_invoice_order(
								this.currentOrder
							);
						}
						else {
							syncedOrderBackendIds = await this.env.pos.push_single_order(this.currentOrder);
						}
						
					} else {
						syncedOrderBackendIds = await this.env.pos.push_single_order(this.currentOrder);
					}
				} catch (error) {
					if (error instanceof Error) {
						throw error;
					} else {
						await this._handlePushOrderError(error);
					}
				}
				if (syncedOrderBackendIds.length && this.currentOrder.wait_for_push_order()) {
					const result = await this._postPushOrderResolve(
						this.currentOrder,
						syncedOrderBackendIds
					);
					if (!result) {
						await this.showPopup('ErrorPopup', {
							title: 'Error: no internet connection.',
							body: error,
						});
					}
				}

				this.showScreen(this.nextScreen);

				// If we succeeded in syncing the current order, and
				// there are still other orders that are left unsynced,
				// we ask the user if he is willing to wait and sync them.
				if (syncedOrderBackendIds.length && this.env.pos.db.get_orders().length) {
					const { confirmed } = await this.showPopup('ConfirmPopup', {
						title: this.env._t('Remaining unsynced orders'),
						body: this.env._t(
							'There are unsynced orders. Do you want to sync these orders?'
						),
					});
					if (confirmed) {
						// NOTE: Not yet sure if this should be awaited or not.
						// If awaited, some operations like changing screen
						// might not work.
						this.env.pos.push_orders();
					}
				}
			}
		}

	Registries.Component.extend(PaymentScreen, BiPaymentScreen);

	return PaymentScreen;

});