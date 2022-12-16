odoo.define('pos_all_in_one.pos_reports', function(require) {
	"use strict";
	const models = require('point_of_sale.models');
	const screens = require('point_of_sale.ProductScreen');
	const PaymentScreen = require('point_of_sale.PaymentScreenNumpad');
	const ActionpadWidget = require('point_of_sale.ActionpadWidget'); 
	const core = require('web.core');
	const gui = require('point_of_sale.Gui');
	const popups = require('point_of_sale.ConfirmPopup');
	// const popups = require('point_of_sale.PopupControllerMixin');
	const rpc = require('web.rpc');
	const Registries = require('point_of_sale.Registries');

	var QWeb = core.qweb;
	var _t = core._t;
	
	models.load_models({	
		model: 'stock.location',
		fields: [],
        domain: function(self) {return [['company_id', '=', self.company && self.company.id || false]]},
		loaded: function(self, locations){
				self.prd_locations = locations;
			},
		});

	models.load_models({
		model:  'pos.session',
        domain: function(self) {return [['company_id', '=', self.company && self.company.id || false]]},
		loaded: function(self,pos_sessions){
			self.pos_sessions = pos_sessions
			},
		});

				
	
});
