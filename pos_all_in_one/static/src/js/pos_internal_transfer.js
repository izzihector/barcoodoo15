odoo.define('pos_all_in_one.pos_it', function(require) {
	"use strict";

	var models = require('point_of_sale.models');
	var core = require('web.core');
	var rpc = require('web.rpc');

	var _t = core._t;

	models.load_models({
		model: 'stock.warehouse',
		fields: ['id','name','display_name','company_id'],
		domain: function(self){ return [['company_id','=',self.company && self.company.id]]; }, 
		loaded: function(self, stockwarehouse){
			self.stockwarehouse = stockwarehouse;
		},
	});

	models.load_models({
		model: 'stock.picking.type',
		fields: ['id','name','display_name','code'],
		domain: function(self){ return [
			['code', '=', 'internal'],['warehouse_id','=',self.stockwarehouse[0].id],
			['company_id','=',self.company && self.company.id]]
		}, 
		loaded: function(self, stockpickingtype){
			self.stockpickingtype = stockpickingtype;
		},
	});


	models.load_models({
		model: 'stock.location',
		fields: ['id','name','display_name'],
		domain: function(self){ return [['usage', '=', 'internal'],['company_id','=',self.company && self.company.id]]; },
		loaded: function(self, stocklocations){
			self.stocklocations = stocklocations;
		},
	});

	models.load_models({
		model: 'stock.picking',
		fields: ['id','name','state'],
		domain: function(self){ return [['company_id','=',self.company && self.company.id]]; }, 
		loaded: function(self, stockpicking){
			self.stockpicking = stockpicking;
		},
	});

});
