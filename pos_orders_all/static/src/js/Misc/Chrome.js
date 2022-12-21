odoo.define('pos_orders_all.Chrome', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	const { useState, useRef, useContext } = owl.hooks;
	const { debounce } = owl.utils;
	const { loadCSS } = require('web.ajax');
	const { useListener } = require('web.custom_hooks');

	const Chrome = require('point_of_sale.Chrome');

	const BiChrome = (Chrome) =>
		class extends Chrome {
			constructor() {
				super(...arguments);
			}
			get is_stock_sync() {
				if(this.env && this.env.pos && this.env.pos.config && this.env.pos.config.show_stock_location == 'specific'){
					return true
				}
				else{
					return false
				}
			}
		}
	Registries.Component.extend(Chrome, BiChrome);
	return Chrome;
});
