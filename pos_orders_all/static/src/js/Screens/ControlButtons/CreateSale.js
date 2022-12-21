odoo.define('pos_orders_all.CreateSale', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require('web.custom_hooks');
	const Registries = require('point_of_sale.Registries');

	class CreateSale extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}
		async onClick() {
			let self = this;
			let order = self.env.pos.get_order();
			let partner_id = false
			if (order.get_client() != null)
				partner_id = order.get_client().id;
			
			if (!partner_id) {
				return self.showPopup('ErrorPopup', {
					title: self.env._t('Unknown customer'),
					body: self.env._t('You cannot Create Sales Order. Select customer first.'),
				});
			}

			let orderlines = order.get_orderlines();
			let cashier_id = self.env.pos.user.id;
			if(self.env.pos.get_cashier() && self.env.pos.get_cashier().user_id){
				cashier_id = self.env.pos.get_cashier().user_id[0];
			}
			if (orderlines.length < 1) {
				return self.showPopup('ErrorPopup', {
					title: self.env._t('Empty Order'),
					body: self.env._t('There must be at least one product in your order before Add a note.'),
				});
			}
			
			let pos_product_list = [];
			orderlines.forEach(function(ol) {
				let product_items = {
					'id': ol.product.id,
					'quantity': ol.quantity,
					'uom_id': ol.product.uom_id[0],
					'price': ol.price,
					'discount': ol.discount,
				};
				pos_product_list.push(product_items);
			});
			this.rpc({
				model: 'pos.order',
				method: 'create_sales_order',
				args: [1, partner_id, pos_product_list, cashier_id],
			}).then(function(output) {
				if(orderlines.length > 0){
					for (var line in orderlines)
					{
						order.remove_orderline(order.get_orderlines());
					}
				}
				order.set_client(false)
	            self.showPopup('ConfirmPopup', {
	                title: self.env._t('Sale Order Information'),
	                body: self.env._t(
	                    'Sales Order '+ output+' is Created !!!!'
	                ),
	            });
			});
		}
	}
	CreateSale.template = 'CreateSale';

	ProductScreen.addControlButton({
		component: CreateSale,
		condition: function() {
			return true;
		},
	});

	Registries.Component.add(CreateSale);

	return CreateSale;
});
