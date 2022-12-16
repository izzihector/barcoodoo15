odoo.define('pos_all_in_one.ProductsWidget', function(require) {
	"use strict";

	const Registries = require('point_of_sale.Registries');
	const ProductsWidget = require('point_of_sale.ProductsWidget');
	var models = require('point_of_sale.models');


	const BiProductsTemplateWidget = (ProductsWidget) =>
		class extends ProductsWidget {
			constructor() {
				super(...arguments);
			}

			mounted() {
				super.mounted();
				this.env.pos.on('change:is_sync', this.render, this);
				let self = this;
				self.env.services.bus_service.updateOption('pos.sync.product',self.env.session.uid);
				self.env.services.bus_service.onNotification(self,self._onProductNotification);
				self.env.services.bus_service.startPolling();
				self.env.services.bus_service._startElection();
			}

			_onProductNotification(notifications){
				let self = this;
				notifications.forEach(function (ntf) {
					ntf = JSON.parse(JSON.stringify(ntf))
					if(ntf && ntf.type){
						if (ntf.type.access == 'pos.sync.product'){
							let prod = ntf.type.product[0];
							let old_category_id = self.env.pos.db.product_by_id[prod.id];
							let new_category_id = prod.pos_categ_id[0];
							let stored_categories = self.env.pos.db.product_by_category_id;

							prod.pos = self.env.pos;
							if(self.env.pos.db.product_by_id[prod.id]){
								if(old_category_id.pos_categ_id){
									stored_categories[old_category_id.pos_categ_id[0]] = stored_categories[old_category_id.pos_categ_id[0]].filter(function(item) {
										return item != prod.id;
									});
								}
								if(stored_categories[new_category_id]){
									stored_categories[new_category_id].push(prod.id);
								}
								self.env.pos.db.product_by_id[prod.id] = new models.Product({}, prod);
							}else{
								self.env.pos.db.add_products(_.map( ntf.type.product, function (prd) {
									return new models.Product({}, prd);
								}));
							}
							self.env.pos.set("is_sync",false);
						}
						
					}
				});
				let call = self.productsToDisplay;
				this.env.pos.set("is_sync",true);
			}


			get productsToDisplay() {
				let self = this;
				let product_ids = super.productsToDisplay;
				var list = [];
				var temp = this.env.pos.product_templates;
				var product_tmpl_lst = []
				if (product_ids) {
					for (var i = 0; i < temp.length; i++) {
						for (var j = 0 ; j < product_ids.length ; j++){
							var prd_prod = product_ids[j]
							if(jQuery.inArray( prd_prod.product_tmpl_id, product_tmpl_lst ) == -1){
								if(prd_prod.product_tmpl_id == temp[i].id){
									var prd_list = temp[i].product_variant_ids.sort();
									list.push(prd_prod)
									product_tmpl_lst.push(temp[i].id)
								}
							}
						}
					}
				}
				let newArray = [];
				let uniqueObject = {};
				for (let i in product_ids) {
					var objTitle = product_ids[i]['product_tmpl_id'];
					uniqueObject[objTitle] = product_ids[i];
				}
				for (i in uniqueObject) {
					newArray.push(uniqueObject[i]);
				}
				return newArray;
			}

			willUnmount() {
				super.willUnmount();
				this.env.pos.off('change:is_sync', null, this);
			}
			get is_sync() {
				return this.env.pos.get('is_sync');
			}
		};

	Registries.Component.extend(ProductsWidget, BiProductsTemplateWidget);

	return ProductsWidget;

});