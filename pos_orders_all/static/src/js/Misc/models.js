// pos_orders_all js
odoo.define('pos_orders_all.models', function(require) {
	"use strict";

	var models = require('point_of_sale.models');
	var PosDB = require("point_of_sale.DB");
	var utils = require('web.utils');
	var round_pr = utils.round_precision;
	var field_utils = require('web.field_utils');

	PosDB.include({
		init: function(options){
			this.get_orders_by_id = {};
			this.get_orders_by_barcode = {};
			this.get_orderline_by_id = {};
			this._super(options);
		},
	});

	models.load_fields('res.company', ['point_of_sale_update_stock_quantities'])
	models.load_fields('res.user', ['tz'])
	models.load_fields('product.product', ['type','virtual_available',
		'available_quantity','qty_available','incoming_qty','outgoing_qty',
		'is_coupon_product']);

	models.load_models({
		model: 'stock.location',
		fields: [],
		loaded: function(self, locations){
			self.locations = locations[0];
			if (self.config.show_stock_location == 'specific')
			{
				for(let i = 0; i < locations.length; i++){
					if(locations[i].id === self.config.stock_location_id[0]){
						self.locations =  locations[i];
					}
				}
			}
		},
	});

	models.load_models({
		model: 'pos.gift.coupon',
		fields: ['name','apply_coupon_on', 'c_barcode', 'user_id', 'issue_date', 'expiry_date', 'partner_id', 'order_ids', 'active', 'amount', 'description','used','coupon_count', 'coupon_apply_times','expiry_date','partner_true','partner_id'],
		domain: null,
		loaded: function(self, pos_gift_coupon) { 
			self.pos_gift_coupon = pos_gift_coupon;    
		},
	});

	var posorder_super = models.Order.prototype;
	models.Order = models.Order.extend({
		initialize: function(attr, options) {
			this.barcode = this.barcode || "";
			this.return_order_ref = this.return_order_ref || false;
			this.imported_sales = this.imported_sales || [];
			this.is_coupon_used = this.is_coupon_used || false;
			this.set_barcode();
			posorder_super.initialize.call(this,attr,options);
		},

		get_total_items: function() {
			var items = round_pr(this.orderlines.reduce((function(sum, orderLine) {
				if((orderLine.product['type'] == 'product') || (orderLine.product['type'] == 'consu')){
					return sum + orderLine.quantity;
				}else{
					return sum
				}
			}), 0), this.pos.currency.rounding);
			return items;
		},

		get_fixed_discount: function() {
			var total=0.0;
			var i;
			for(i=0;i<this.orderlines.models.length;i++) 
			{	
				total = total + parseFloat(this.orderlines.models[i].discount * this.orderlines.models[i].quantity);
			}
			return total
		},

		set_barcode: function(){
			var self = this;	
			var temp = Math.floor(100000000000+ Math.random() * 9000000000000)
			self.barcode =  temp.toString();
		},

		set_return_order_ref: function (return_order_ref) {
			this.return_order_ref = return_order_ref;
		},

		set_imported_sales: function(so){
			let sale = so.toString();
			if(!this.imported_sales.includes(sale))
				this.imported_sales += sale+',';
		},

		get_imported_sales: function(){
			return this.imported_sales;
		},

		set_is_coupon_used: function(is_coupon_used){
			this.is_coupon_used = is_coupon_used;
			this.trigger('change',this);
		},

		get_is_coupon_used: function(is_coupon_used){
			return this.is_coupon_used;
		},

		export_as_JSON: function() {
			var self = this;
			var loaded = posorder_super.export_as_JSON.call(this);
			loaded.barcode = self.barcode;
			loaded.return_order_ref = self.return_order_ref  || false;
			loaded.imported_sales = self.imported_sales || [];
			loaded.is_coupon_used = self.is_coupon_used || false;
			loaded.coupon_id = self.coupon_id;
			loaded.coup_maxamount = self.coup_maxamount;
			return loaded;
		},

		init_from_JSON: function(json){
			posorder_super.init_from_JSON.apply(this,arguments);
			this.barcode = json.barcode;
			this.return_order_ref = json.return_order_ref || false;
			this.imported_sales = json.imported_sales || [];
			this.is_coupon_used = json.is_coupon_used || false;
			this.coupon_id = json.coupon_id;
			this.coup_maxamount = json.coup_maxamount;
		},

		remove_orderline: function( line ){
			var prod = line.product;
			if(prod && prod.is_coupon_product){
				this.set_is_coupon_used(false);
			}
			this.assert_editable();
			this.orderlines.remove(line);
			this.coupon_id = false;	
			this.select_orderline(this.get_last_orderline());
		},

	});

	var OrderlineSuper = models.Orderline.prototype;
	models.Orderline = models.Orderline.extend({

		initialize: function(attr, options) {
			this.original_line_id = this.original_line_id || false;
			OrderlineSuper.initialize.call(this,attr,options);
		},

		set_original_line_id: function(original_line_id){
			this.original_line_id = original_line_id;
		},

		get_original_line_id: function(){
			return this.original_line_id;
		},

		export_as_JSON: function() {
			var json = OrderlineSuper.export_as_JSON.apply(this,arguments);
			json.original_line_id = this.original_line_id || false;
			return json;
		},
		
		init_from_JSON: function(json){
			OrderlineSuper.init_from_JSON.apply(this,arguments);
			this.original_line_id = json.original_line_id;
		},

		set_discount: function(discount){
			var parsed_discount = isNaN(parseFloat(discount)) ? 0 : field_utils.parse.float('' + discount);

			if (this.pos.config.discount_type == 'percentage'){
				var disc = Math.min(Math.max(parsed_discount || 0, 0),100);
			}
			if (this.pos.config.discount_type == 'fixed'){
				var disc = parsed_discount;
			}
			this.discount = disc;
			this.discountStr = '' + disc;
			this.trigger('change',this);
		},
	

		get_base_price:    function(){
			var rounding = this.pos.currency.rounding;
			if (this.pos.config.discount_type == 'percentage'){
				return round_pr(this.get_unit_price() * this.get_quantity() * (1 - this.get_discount()/100), rounding);
			}
			if (this.pos.config.discount_type == 'fixed'){
				return round_pr((this.get_unit_price()- this.get_discount())* this.get_quantity(), rounding);	
			}
		},
		
		get_all_prices: function(){
			var self = this
			if (this.pos.config.discount_type == 'percentage')
			{
				var price_unit = this.get_unit_price() * (1.0 - (this.get_discount() / 100.0));
			}
			if (this.pos.config.discount_type == 'fixed')
			{
				var price_unit = this.get_base_price()/this.get_quantity();		
			}	
			var taxtotal = 0;

			var product =  this.get_product();
			var taxes_ids = _.filter(product.taxes_id, t => t in this.pos.taxes_by_id);
			var taxes =  this.pos.taxes;
			var taxdetail = {};
			var product_taxes = [];

			_(taxes_ids).each(function(el){
	            var tax = _.detect(taxes, function(t){
	                return t.id === el;
	            });
				product_taxes.push.apply(product_taxes, self._map_tax_fiscal_position(tax));
			});
			product_taxes = _.uniq(product_taxes, function(tax) { return tax.id; });

			var all_taxes = this.compute_all(product_taxes, price_unit, this.get_quantity(), this.pos.currency.rounding);
			var all_taxes_before_discount = this.compute_all(product_taxes, price_unit, this.get_quantity(), this.pos.currency.rounding);
	        _(all_taxes.taxes).each(function(tax) {
	            taxtotal += tax.amount;
	            taxdetail[tax.id] = tax.amount;
	        });

	        return {
	            "priceWithTax": all_taxes.total_included,
	            "priceWithoutTax": all_taxes.total_excluded,
	            "priceSumTaxVoid": all_taxes.total_void,
	            "priceWithTaxBeforeDiscount": all_taxes_before_discount.total_included,
	            "tax": taxtotal,
	            "taxDetails": taxdetail,
	        };
		},

		get_display_price_one: function(){
			var rounding = this.pos.currency.rounding;
			var price_unit = this.get_unit_price();
			if (this.pos.config.iface_tax_included !== 'total') {
				if (this.pos.config.discount_type == 'percentage')
				{
					return round_pr(price_unit * (1.0 - (this.get_discount() / 100.0)), rounding);
				}
				if (this.pos.config.discount_type == 'fixed')
				{
					return round_pr(price_unit  - this.get_discount(), rounding);
				}	
			} else {
				var product =  this.get_product();
				var taxes_ids = product.taxes_id;
				var taxes =  this.pos.taxes;
				var product_taxes = [];

				_(taxes_ids).each(function(el){
					product_taxes.push(_.detect(taxes, function(t){
						return t.id === el;
					}));
				});

				var all_taxes = this.compute_all(product_taxes, price_unit, 1, this.pos.currency.rounding);
				if (this.pos.config.discount_type == 'percentage')
				{
					return round_pr(all_taxes.total_included * (1 - this.get_discount()/100), rounding);
				}
				if (this.pos.config.discount_type == 'fixed')
				{
					return round_pr(all_taxes.total_included  - this.get_discount(), rounding);
				}	
			}
		},

	});

});