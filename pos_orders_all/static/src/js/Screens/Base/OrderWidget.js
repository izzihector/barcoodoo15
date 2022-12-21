odoo.define('pos_orders_all.OrderWidgetExtended', function(require){
	'use strict';

	const OrderWidget = require('point_of_sale.OrderWidget');
	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');
	const { Component } = owl;

	const OrderSummaryExtended = (OrderWidget) =>
		class extends OrderWidget {
			constructor() {
				super(...arguments);
			}

			get total_items(){
				let order = this.env.pos.get_order();
				let total_items    = order ? order.get_total_items() : 0;
				return total_items.toFixed(2);;
			}	
	};

	Registries.Component.extend(OrderWidget, OrderSummaryExtended);

	return OrderWidget;

});