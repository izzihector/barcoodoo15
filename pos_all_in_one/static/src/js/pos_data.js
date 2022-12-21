odoo.define('pos_all_in_one.pos_data', function (require) {
"use strict";

var models = require('point_of_sale.models');
let core = require('web.core');
var QWeb = core.qweb;
var _t = core._t;


	models.load_models({
		model: 'res.currency',
		fields: ['name','symbol','position','rounding','rate','rate_in_company_currency'],
		domain: null, 
		loaded: function(self, poscurrency){
			self.poscurrency = poscurrency;
		},
	});

	var OrderSuper = models.Order.prototype;
	models.Order = models.Order.extend({
		initialize: function(attributes, options) {
			OrderSuper.initialize.apply(this, arguments);
			this.currency_amount = this.currency_amount || "";
			this.currency_symbol = this.currency_symbol || "";
			this.currency_name = this.currency_name || "";
			this.recipet = this.recipet || "";
		},

		set_symbol: function(currency_symbol){
			this.currency_symbol = currency_symbol;
			this.trigger('change',this);
		},

		set_curamount: function(currency_amount){
			this.currency_amount = currency_amount;
			this.trigger('change',this);
		},

		set_curname: function(currency_name){
			this.currency_name = currency_name;
			this.trigger('change',this);
		},

		set_inrecipt: function(recipet){
			this.recipet = recipet;
			this.trigger('change',this);
		},

		get_curamount: function(currency_amount){
			return this.currency_amount;
		},

		get_symbol: function(currency_symbol){
			return this.currency_symbol;
		},

		get_curname: function(currency_name){
			return this.currency_name;
		},

		get_inrecipt: function(recipet){
			return this.recipet;
		},

		export_for_printing: function(){
			var json = OrderSuper.export_for_printing.call(this);
			json.currency_amount = this.get_curamount() || 0.0;
			json.currency_symbol = this.get_symbol() || false;
			json.currency_name = this.get_curname() || false;
			json.recipet = this.get_inrecipt()|| false;
			return json;
		},

		export_as_JSON: function() {
			var self = this;
			var loaded = OrderSuper.export_as_JSON.apply(this, arguments);
			loaded.currency_amount = self.get_curamount() || 0.0;
			loaded.currency_symbol = self.get_symbol() || false;
			loaded.currency_name = self.get_curname() || false;
			loaded.recipet = self.get_inrecipt()|| false;
			return loaded;
		},

		init_from_JSON: function(json){
			OrderSuper.init_from_JSON.apply(this,arguments);
			this.currency_amount = json.currency_amount || "";
			this.currency_symbol = json.currency_symbol || "";
			this.currency_name = json.currency_name || "";
			this.recipet = json.recipet || "";
		},

	});

	var PaymentSuper = models.Paymentline.prototype;
	models.Paymentline = models.Paymentline.extend({
		initialize: function(attributes, options) {
			PaymentSuper.initialize.apply(this, arguments);
			this.currency_amount = this.currency_amount || 0.0;
			this.currency_name = this.currency_name || this.pos.company_currency.name;
			this.currency_symbol = this.currency_symbol || this.pos.company_currency.symbol;
		},

		export_as_JSON: function() {
			var self = this;
			var loaded = PaymentSuper.export_as_JSON.apply(this, arguments);
			loaded.currency_amount = this.currency_amount || 0.0;
			loaded.currency_name = this.currency_name || this.pos.company_currency.name;
			loaded.currency_symbol = this.currency_symbol || this.pos.company_currency.symbol;
			return loaded;
		},

		export_for_printing: function() {
			var loaded = PaymentSuper.export_for_printing.apply(this,arguments);
			loaded.currency_amount = this.currency_amount || 0.0;
			loaded.currency_name = this.currency_name || this.pos.company_currency.name;
			loaded.currency_symbol = this.currency_symbol || this.pos.company_currency.symbol;
			return loaded;
		},

		init_from_JSON: function(json){
			PaymentSuper.init_from_JSON.apply(this,arguments);
			this.currency_amount = json.currency_amount || 0.0;
			this.currency_name = json.currency_name || this.pos.company_currency.name;
			this.currency_symbol = json.currency_symbol || this.pos.company_currency.symbol;
		},

		set_curname: function(currency_name){
			this.currency_name = currency_name;
			this.trigger('change',this);
		},

		set_curamount: function(currency_amount){
			this.currency_amount = currency_amount;
			this.trigger('change',this);
		},

		set_currency_symbol: function(currency_symbol){
			this.currency_symbol = currency_symbol;
			this.trigger('change',this);
		},
	});


		

});
