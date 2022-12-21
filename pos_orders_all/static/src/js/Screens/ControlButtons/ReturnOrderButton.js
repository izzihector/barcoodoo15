odoo.define('pos_orders_all.ReturnOrderButton', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const POSOrdersScreen= require('pos_orders_all.POSOrdersScreen');
	const { useListener } = require('web.custom_hooks');
	const Registries = require('point_of_sale.Registries');

	class ReturnOrderButton extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}
		async onClick() {
			let self = this;
			const PosOrder = new (Registries.Component.get(POSOrdersScreen))(this, {
			'selected_partner_id': false 
			});
			let load_orders = [];
			let load_orders_line = [];
			let order_ids = [];
			const pos_domain =PosOrder.get_orders_domain() ||[];
				await self.rpc({
					model: 'pos.order',
					method: 'search_read',
					args: [pos_domain],
				}).then(function(output) {
					if (self.env.pos.config.pos_session_limit == 'current_day')
					{
						let today = PosOrder.get_current_day();
						output.forEach(function(i) {
							if(today == i.pos_order_date)
							{
								load_orders.push(i);
							}
						});
					}
					else{
						load_orders = output;
					}
					self.env.pos.db.get_orders_by_id = {};
					self.env.pos.db.get_orders_by_barcode = {};
					load_orders.forEach(function(order) {
						order_ids.push(order.id)
						self.env.pos.db.get_orders_by_id[order.id] = order;		
						self.env.pos.db.get_orders_by_barcode[order.barcode] = order;						
					});

					
					let fields_domain = [['order_id','in',order_ids]];
					self.rpc({
						model: 'pos.order.line',
						method: 'search_read',
						args: [fields_domain],
					}).then(function(output1) {
						self.env.pos.db.all_orders_line_list = output1;
						load_orders_line = output1;
						self.env.pos.set({'all_orders_list' : load_orders});
						self.env.pos.set({'all_orders_line_list' : output1});
						self.orders = load_orders;
						self.orderlines = output1;

						self.env.pos.db.get_orderline_by_id = {};
						output1.forEach(function(ol) {
							self.env.pos.db.get_orderline_by_id[ol.id] = ol;						
						});
						return [load_orders,load_orders_line]
					});
				}); 


			const { confirmed, payload: inputNote } = await this.showPopup('TextInputPopup', {
				title: this.env._t('Return Order Barcode'),
			});

			if (confirmed) {
				let entered_barcode = inputNote;
				let order = self.env.pos.db.get_orders_by_barcode[entered_barcode];
				if(order){
					let orderlines = [];
					$.each(order.lines, function(index, value) {
						let ol = self.env.pos.db.get_orderline_by_id[value];
						orderlines.push(ol);
					});
					self.showPopup('ReturnOrderPopup', {
						'order': order, 
						'orderlines':orderlines,
					});
				}else{
					self.showPopup('ErrorPopup', {
						'title': self.env._t('Invalid Barcode'),
						'body': self.env._t("No Order Found for this Barcode"),
					});
				}
			}
		}
	}
	ReturnOrderButton.template = 'ReturnOrderButton';

	ProductScreen.addControlButton({
		component: ReturnOrderButton,
		condition: function() {
			return this.env.pos.config.show_order;
		},
	});

	Registries.Component.add(ReturnOrderButton);

	return ReturnOrderButton;
});
