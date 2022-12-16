// pos_create_sales_order js
odoo.define('pos_all_in_one.pos_payment', function(require) {
	"use strict";

	var models = require('point_of_sale.models');
	var core = require('web.core');
	const Chrome = require('point_of_sale.Chrome');
	var PosDB = require('point_of_sale.DB');
	
	var rpc = require('web.rpc');
	var utils = require('web.utils');
	var round_pr = utils.round_precision;

	var QWeb = core.qweb;
	var _t = core._t;

	models.load_models({
		model:  'account.move',
		fields: ['name','partner_id','amount_total','amount_residual','amount_residual','state','move_type'],
		domain: [['move_type','=','out_invoice'], ['state','=','posted'],['payment_state','!=','paid'],
		['company_id','=',self.company && self.company.id]],
		loaded: function(self, invoices){
			self.invoices = invoices;
			
			self.get_invoices_by_id = [];
			invoices.forEach(function(invoice) {
				self.get_invoices_by_id[invoice.id] = invoice;
			});
		},
	});

	models.load_models({
		model:  'account.journal',
		fields: ['id','name','type'],
		domain: [['type','in',['cash','bank']]],
		loaded: function(self, journals){
//		    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",journals , self.company)
			self.journals = journals;
		},
	});

	

	var _super_posmodel = models.PosModel.prototype;
	models.PosModel = models.PosModel.extend({
		load_new_invoices: function(){
			var self = this;
			var def  = new $.Deferred();
			var fields = _.find(this.models,function(model){ return model.model === 'account.move'; }).fields;
			var domain = [['move_type','=','out_invoice'],
			['state','=','posted'], ['payment_state', '!=', 'paid'],
			['company_id','=',self.company && self.company.id]];

			rpc.query({
				model: 'account.move',
				method: 'search_read',
				args: [domain, fields],
			}, {
				timeout: 3000,
				shadow: true,
			})
			.then(function(products){
					if (self.db.invoices) {   
						def.resolve();
					} else {
						def.reject();
					}
				}, function(err,event){ event.preventDefault(); def.reject(); });
			return def;
		},
			
	});

	var PosDB=PosDB.extend({
			
		init: function(options){
			this.invoice_sorted = [];
			this.invoice_by_id = {};
			this.invoice_line_id = {};
			this.invoice_search_string = "";
			this.invoice_write_date = null;
			return PosDB.prototype.init.call(this, options);
		},
		
	
		get_invoices_sorted: function(max_count){
			max_count = max_count ? Math.min(this.invoice_sorted.length, max_count) : this.invoice_sorted.length;
			var invoice = [];
			for (var i = 0; i < max_count; i++) {
				invoices.push(this.invoice_by_id[this.invoice_sorted[i]]);
			}
			return invoices;
		},
					
		get_product_write_date:function(products){
			return this.invoice_write_date || "1970-01-01 00:00:00";
		},
	});
});
