odoo.define('pos_all_in_one.pos_prod_op', function (require) {
	"use strict";

	var models = require('point_of_sale.models');
	// models.load_fields('product.product', ['image_1920']);

	models.load_models({
		model: 'pos.category',
		fields: ['id', 'name', 'parent_id', 'child_id', 'write_date'],
		loaded: function(self, pos_category) {
			self.pos_category = pos_category;
		},

	});

	models.PosModel = models.PosModel.extend({
		prepare_new_products_domain: function(){
			return [['write_date','>', this.db.get_partner_write_date()]];
		},

		load_new_products: function(){
			var self = this;
			return new Promise(function (resolve, reject) {
				var fields = ['display_name', 'lst_price', 'standard_price', 'categ_id', 'pos_categ_id', 'taxes_id',
                 'barcode', 'default_code', 'to_weight', 'uom_id', 'description_sale', 'description',
                 'product_tmpl_id','tracking', 'write_date', 'available_in_pos', 'attribute_line_ids']
				var domain = []
				var context = { display_default_code: false };
				self.rpc({
					model: 'product.product',
					method: 'search_read',
					kwargs: {
	                    context,
	                    domain,
	                    fields,
	                },
					// args: [domain,fields],
				}, {
					timeout: 3000,
					shadow: true,
				})
				.then(function (products) {	
					if (self.db.add_products(products)) {   // check if the products we got were real updates
						resolve();
					} else {
						reject('Failed in updating products.');
					}
				}, function (type, err) { reject(); });
			});
		},
	});
});