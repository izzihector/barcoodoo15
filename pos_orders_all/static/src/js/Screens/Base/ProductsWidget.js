// BiProductScreen js
odoo.define('pos_orders_all.ProductsWidget', function(require) {
	"use strict";

	const Registries = require('point_of_sale.Registries');
	const ProductsWidget = require('point_of_sale.ProductsWidget');

	const BiProductsWidget = (ProductsWidget) =>
		class extends ProductsWidget {
			constructor() {
				super(...arguments);
			}

			mounted() {
				super.mounted();
				this.env.pos.on('change:is_sync', this.render, this);
			}
			willUnmount() {
				super.willUnmount();
				this.env.pos.off('change:is_sync', null, this);
			}

			_switchCategory(event) {
				this.env.pos.set("is_sync",true);
				super._switchCategory(event);
			}

			_updateSearch(event) {
				this.env.pos.set("is_sync",true);
				this.state.searchWord = event.detail;
			}

			get is_sync() {
				return this.env.pos.get('is_sync');
			}

			get productsToDisplay() {
				let self = this;
				let prods = super.productsToDisplay;
				if (self.env.pos.config.show_stock_location == 'specific')
				{
					let prod_ids = [];
					$.each(prods, function( i, prd ){
						prod_ids.push(prd.id)
					});
					let x_sync = self.env.pos.get("is_sync")
					let location = self.env.pos.locations;
					if(x_sync == true){
						if (self.env.pos.config.pos_stock_type == 'onhand'){
							this.rpc({
								model: 'stock.quant',
								method: 'get_products_stock_location_qty',
								args: [1, location,prod_ids],
							}).then(function(output) {
								self.env.pos.loc_onhand = output[0];
								$.each(prods, function( i, prd ){
									prd['bi_on_hand'] = prd.qty_available;
									prd['bi_available'] = prd.virtual_available;
									for(let key in self.env.pos.loc_onhand){
										if(prd.id == key){
											prd['bi_on_hand'] = self.env.pos.loc_onhand[key];
											var product_qty_final = $("[data-product-id='"+prd.id+"'] #stockqty");
											product_qty_final.text();
											product_qty_final.text(self.env.pos.loc_onhand[key]);
										}
									}
								});
								self.env.pos.set("is_sync",false);
							});
						}
						if (self.env.pos.config.pos_stock_type == 'available')
						{
							this.rpc({
								model: 'product.product',
								method: 'get_stock_location_avail_qty',
								args: [1, location,prod_ids],
							}).then(function(output) {
								self.env.pos.loc_available = output[0];

								$.each(prods, function( i, prd ){
									prd['bi_on_hand'] = prd.qty_available;
									prd['bi_available'] = prd.virtual_available;
									for(let key in self.env.pos.loc_available){
										if(prd.id == key)
										{
											prd['bi_available'] = self.env.pos.loc_available[key];
											
											var product_qty_avail = $("[data-product-id='"+prd.id+"'] #availqty");
											product_qty_avail.text();
											product_qty_avail.text(self.env.pos.loc_available[key]);
										}
									}
								});
								self.env.pos.set("is_sync",false);
							});
						}
					}else{
					 	$.each(prods, function( i, prd ){
							prd['bi_on_hand'] = prd.qty_available;
							prd['bi_available'] = prd.virtual_available;
						});
					}
				}
				else{
					$.each(prods, function( i, prd ){
						prd['bi_on_hand'] = prd.qty_available;
						prd['bi_available'] = prd.virtual_available;
					});
				}
				return prods;
			}
		};

	Registries.Component.extend(ProductsWidget, BiProductsWidget);

	return ProductsWidget;

});
