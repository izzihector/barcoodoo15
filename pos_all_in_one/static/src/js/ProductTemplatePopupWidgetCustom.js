
odoo.define('pos_all_in_one.ProductTemplatePopupWidgetCustom', function(require){
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');	

	class ProductTemplatePopupWidgetCustom extends Popup {

		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}
	}
	
	ProductTemplatePopupWidgetCustom.template = 'ProductTemplatePopupWidgetCustom';

	Registries.Component.add(ProductTemplatePopupWidgetCustom);

	return ProductTemplatePopupWidgetCustom;

});