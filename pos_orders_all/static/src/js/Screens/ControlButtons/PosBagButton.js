odoo.define('pos_orders_all.PosBagButton', function(require) {
	"use strict";

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require('web.custom_hooks');
	const Registries = require('point_of_sale.Registries');

	class PosBagButton extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}
		async onClick() {
			let self = this;
			let selectedOrder = self.env.pos.get_order();
			let category = self.env.pos.config.pos_bag_category_id;
			if(category){
				let products = self.env.pos.db.get_product_by_category(category[0]);
				if (products.length == 1) { 
					selectedOrder.add_product(products[0]);
					self.env.pos.set_order(selectedOrder);
					self.showScreen('ProductScreen');
				}else{
					products.forEach(function(prd) {
						prd['image_url'] = window.location.origin + '/web/binary/image?model=product.product&field=image_medium&id=' + prd.id;
					});
					self.showPopup('PosBagPopup', {'products': products});
				}	
			}
		}
	}
	PosBagButton.template = 'PosBagButton';

	ProductScreen.addControlButton({
		component: PosBagButton,
		condition: function() {
			return this.env.pos.config.allow_bag_charges;
		},
	});

	Registries.Component.add(PosBagButton);

	return PosBagButton;

});


	