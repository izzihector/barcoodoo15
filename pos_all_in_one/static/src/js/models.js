// pos_all_in_one js
odoo.define('pos_all_in_one.models', function(require) {
	"use strict";

	var models = require('point_of_sale.models');
	var PosDB = require("point_of_sale.DB");


	PosDB.include({
		get_unpaid_orders: function(){
			var saved = this.load('unpaid_orders',[]);
			var orders = [];
			for (var i = 0; i < saved.length; i++) {
				let odr = saved[i].data;
				if(!odr.is_paying_partial && !odr.is_partial && !odr.is_draft_order){
					orders.push(saved[i].data);
				}
				if(odr.is_paying_partial || odr.is_partial || odr.is_draft_order){
					saved = _.filter(saved, function(o){
						return o.id !== odr.uid;
					});
				}
			}
			this.save('unpaid_orders',saved);
			return orders;
		},
	});


	var posorder_super = models.Order.prototype;
	models.Order = models.Order.extend({

		initialize: function(attr,options) {
			var self = this;
			this.is_partial    = false;
			this.is_paying_partial    = false;
			this.amount_due    = 0;
			this.amount_paid    = 0;
			this.is_draft_order = false;
			this.set_is_partial();
			posorder_super.initialize.call(this,attr,options);
		},

		init: function(parent, options) {
			var self = this;
			this._super(parent,options);
			this.set_is_partial();
		},
		
		set_is_partial: function(set_partial){
			this.is_partial = set_partial || false;
			this.trigger('change',this);
		},

		export_as_JSON: function(){
			var loaded = posorder_super.export_as_JSON.apply(this, arguments);
			loaded.is_partial = this.is_partial || false;
			loaded.amount_due = this.get_partial_due();
			loaded.is_paying_partial = this.is_paying_partial;
			loaded.is_draft_order = this.is_draft_order || false;
			return loaded;
		},

		init_from_JSON: function(json){
			posorder_super.init_from_JSON.apply(this,arguments);
			this.is_partial = json.is_partial;
			this.amount_due = json.amount_due;
			this.is_paying_partial = json.is_paying_partial;
			this.is_draft_order = json.is_draft_order;
		},

		get_partial_due: function () {
			let due = 0;
			if(this.get_due() > 0){
				due = this.get_due();
			}
			return due
		},

	});
});