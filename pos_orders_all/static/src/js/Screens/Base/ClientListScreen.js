odoo.define('pos_orders_all.ClientListScreen', function (require) {
	'use strict';

	const ClientListScreen = require('point_of_sale.ClientListScreen');
	const {useState} = owl.hooks;
	const {useListener} = require('web.custom_hooks');
	const models = require('point_of_sale.models');
	const Registries = require('point_of_sale.Registries');

	const BiClientListScreen = (ClientListScreen) =>
		class extends ClientListScreen {
			constructor() {
				super(...arguments);
				useListener('click-show-orders', this.showOrders);
			}

			async showOrders(event){
				let partner_id = parseInt(event.detail.id);
				await this.showTempScreen('POSOrdersScreen', {
					'selected_partner_id': partner_id 
				});
			}
		}
	Registries.Component.extend(ClientListScreen, BiClientListScreen);

	return ClientListScreen;
});
