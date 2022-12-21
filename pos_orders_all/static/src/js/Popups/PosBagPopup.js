odoo.define('pos_orders_all.PosBagPopup', function(require) {
	"use strict";

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');

	class PosBagPopup extends Popup {

		constructor() {
			super(...arguments);
		}

		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}

		get bags() {
			let bags = [];
			$.each(this.props.products, function( i, prd ){
				prd['bag_image_url'] = `/web/image?model=product.product&field=image_128&id=${prd.id}&write_date=${prd.write_date}&unique=1`;
				bags.push(prd)
			});
			return bags;
		}
		
		click_on_bag_product(event) {
			var self = this;
			var bag_id = parseInt(event.currentTarget.dataset['productId'])
			self.env.pos.get_order().add_product(self.env.pos.db.product_by_id[bag_id]);
			self.trigger('close-popup');
		}

	};
	PosBagPopup.template = 'PosBagPopup';

	Registries.Component.add(PosBagPopup);

	return PosBagPopup;
});