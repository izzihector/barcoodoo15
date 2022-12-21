odoo.define("pos_all_in_one.screens", function(require){
	"use strict";
	
	var models = require('point_of_sale.models');
	var PosDB = require("point_of_sale.DB");

	var core = require('web.core');
	var utils = require('web.utils');

	var QWeb = core.qweb;
	var _t = core._t;

	models.load_fields('product.product', ['name', 'product_template_attribute_value_ids']);

	models.load_models({
		model: 'product.template',
		fields: ['name','display_name','product_variant_ids','product_variant_count',],
		domain: [['sale_ok','=',true],['available_in_pos','=',true],
		['company_id', '=', self.company && self.company.id || false]],
		loaded: function(self, product_templates){
			self.product_templates = product_templates;
			self.db.add_product_templates(product_templates);
		},
	});

	PosDB.include({
		init: function(options){
			this.product_template_by_id = {};
			this.product_tmpl_id = []
			this._super(options);
		},
		add_product_templates: function(product_templates){
			for(var temp=0 ; temp < product_templates.length; temp++){
				var product_template_attribute_value_ids = [];
				var prod_temp =  product_templates[temp] ; 
				this.product_template_by_id[prod_temp.id] = prod_temp;
				this.product_tmpl_id.push(prod_temp)

				for (var prod = 0; prod <prod_temp.product_variant_ids.length; prod++){
					var product = this.product_by_id[prod_temp.product_variant_ids[prod]];
					if(product){
						for (var i = 0; i < product.product_template_attribute_value_ids.length; i++){
							product_template_attribute_value_ids.push(product.product_template_attribute_value_ids[i]);
						}
						product.product_variant_count = prod_temp.product_variant_count;
						product.template_name = prod_temp.name
					}
				}

				const unique_attribute_value_ids = [...new Set(product_template_attribute_value_ids)]
				this.product_template_by_id[prod_temp.id].product_template_attribute_value_ids = unique_attribute_value_ids;
			}
		},
	    /* returns a list of products with :
	     * - a category that is or is a child of category_id,
	     * - a name, package or barcode containing the query (case insensitive) 
	     */
	    search_product_in_category: function(category_id, query){
	        try {
	            query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,'.');
	            query = query.replace(/ /g,'.+');
	            var re = RegExp("([0-9]+):.*?"+utils.unaccent(query),"gi");
	        }catch(e){
	            return [];
	        }
	        var results = [];
	        var product_tmpl_lst = []
	        var temp = this.product_tmpl_id;
	        for(var i = 0; i < this.limit; i++){
	            var r = re.exec(this.category_search_string[category_id]);
	            if(r){
	                var id = Number(r[1]);
	                var prod  = this.get_product_by_id(id)
	                for(var j = 0; j < temp.length ; j++){
	                    if(jQuery.inArray( prod.product_tmpl_id, product_tmpl_lst ) == -1){
	                        if(prod.product_tmpl_id == temp[j].id){
	                            var prd_list = temp[i].product_variant_ids.sort();
	                            results.push(prod)
	                            product_tmpl_lst.push(temp[j].id)
	                        }
	                    }
	                }
	            }else{
	                break;
	            }
	        }
	        return results;
	    },
	});
});
