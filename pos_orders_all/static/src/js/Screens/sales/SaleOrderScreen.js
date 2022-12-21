odoo.define('pos_orders_all.SaleOrderScreen', function (require) {
	'use strict';

	const { debounce } = owl.utils;
	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');

	class SaleOrderScreen extends PosComponent {
		constructor() {
			super(...arguments);
			this.state = {
				query: null,
				selectedSaleOrder: this.props.client,
			};
			useListener('click-importSale', this.importSale);
			useListener('click-showDetails', this.showDetails);
			this.saleorders = this.get_sale_orders()[0] || [];
			this.so_lines = this.get_sale_orders()[1] || [];
			this.updateOrderList = debounce(this.updateOrderList, 70);
		}

		back() {
			this.props.resolve({ confirmed: false, payload: false });
			this.trigger('close-temp-screen');
		}

		get sale_orders() {
			let self = this;
			let query = this.state.query;
			if(query){
				query = query.trim();
				query = query.toLowerCase();
			}
			if(this.saleorders){
				if (query && query !== '') {
					return this.search_orders(this.saleorders,query);
				} else {
					return this.saleorders;
				}
			}
			else{
				let odrs = this.get_sale_orders()[0] || [];
				if (query && query !== '') {
					return this.search_orders(odrs,query);
				} else {
					return odrs;
				}
			}
		}

		importSale(event){
			let self = this;
			let order = event.detail;
			let o_id = parseInt(event.detail.id);
			let so_lines =  self.so_lines;				
			let pos_lines = [];

			for(let n=0; n < so_lines.length; n++){
				if (so_lines[n]['order_id'][0] ==o_id){
					pos_lines.push(so_lines[n])
				}
			}
			self.showPopup('ImportSaleOrder', {
				'order': event.detail, 
				'orderlines':pos_lines,
			});
		}

		search_orders(saleorders,query){
			let self = this;
			let selected_orders = [];
			let search_text = query;
			if(search_text){
				saleorders.forEach(function(odr) {
					if (((odr.name.toLowerCase()).indexOf(search_text) != -1) || 
						((odr.state.toLowerCase()).indexOf(search_text) != -1)|| 
						((odr.user_id[1].toLowerCase()).indexOf(search_text) != -1)|| 
						((odr.partner_id[1].toLowerCase()).indexOf(search_text) != -1)) {
						selected_orders.push(odr);
					}
				});
			}
			return selected_orders;
		}

		refresh_orders(){
			$('.input-search-saleorders').val('');
			this.state.query = '';
			let odrs = this.get_sale_orders()[0] || [];
			this.render();
		}

		updateOrderList(event) {
			this.state.query = event.target.value;
			const sale_orders = this.sale_orders;
			if (event.code === 'Enter' && sale_orders.length === 1) {
				this.state.selectedSaleOrder = sale_orders[0];
			} else {
				this.render();
			}
		}

		clickSaleOrder(event) {
			let order = event.detail.order;
			if (this.state.selectedSaleOrder === order) {
				this.state.selectedSaleOrder = null;
			} else {
				this.state.selectedSaleOrder = order;
			}
			this.render();
		}

		get_current_day() {
			let self = this; 
			let days = self.env.pos.config.load_orders_days;
			let today = new Date();
			if(days > 0){	
				today.setDate(today.getDate() - days);
			}
			let dd = today.getDate();
			let mm = today.getMonth()+1; //January is 0!
			let yyyy = today.getFullYear();
			if(dd<10){
				dd='0'+dd;
			} 
			if(mm<10){
				mm='0'+mm;
			} 
			today = yyyy+'-'+mm+'-'+dd;
			return today;
		}

		get_orders_domain(){
			let self = this; 
			let pos_config = self.env.pos.config;
			let today = self.get_current_day();
			let days = self.env.pos.config.load_orders_days;
			let is_draft_sent= pos_config.load_draft_sent;
			if(days > 0)
			{	
				if(is_draft_sent){
					return [['date_order', '>=',today],['state','in',['draft','sent']]];
				}
				else{
					return [['date_order', '>=',today],['state','not in',['cancel']]];
				}
			}
			else{
				return [['state','in',['draft','sent']]];
			}
		}

		async get_sale_orders () {
			let self = this;
			let sale_domain = self.get_orders_domain();
			let load_orders = [];
			let load_orders_line = [];
			let order_ids = [];
			try {
				await self.rpc({
					model: 'sale.order',
					method: 'search_read',
					args: [sale_domain],
				}).then(function(output) {
					load_orders = output;
					self.env.pos.db.get_so_by_id = {};
					load_orders.forEach(function(order) {
						order_ids.push(order.id)
						self.env.pos.db.get_so_by_id[order.id] = order;						
					});
					let fields_domain = [['order_id','in',order_ids]];
					self.rpc({
						model: 'sale.order.line',
						method: 'search_read',
						args: [fields_domain],
					}).then(function(output1) {
						load_orders_line = output1;
						self.saleorders = load_orders;
						self.so_lines = output1;
						self.env.pos.db.get_so_line_by_id = {};
						output1.forEach(function(ol) {
							self.env.pos.db.get_so_line_by_id[ol.id] = ol;						
						});
						self.render();
						return [load_orders,load_orders_line]
					});
				}); 
			}catch (error) {
				if (error.message.code < 0) {
					await this.showPopup('OfflineErrorPopup', {
						title: this.env._t('Offline'),
						body: this.env._t('Unable to load saleorders.'),
					});
				} else {
					throw error;
				}
			}
		}

		showDetails(event){
			let self = this;
			let o_id = parseInt(event.detail.id);
			let saleorders =  self.saleorders;
			let so_lines =  self.so_lines;
			let orders1 = [event.detail];
			
			let pos_lines = [];

			for(let n=0; n < so_lines.length; n++){
				if (so_lines[n]['order_id'][0] ==o_id){
					pos_lines.push(so_lines[n])
				}
			}
			self.showPopup('SODetail', {
				'order': event.detail, 
				'orderline':pos_lines,
			});
		}
	}


	SaleOrderScreen.template = 'SaleOrderScreen';
	SaleOrderScreen.hideOrderSelector = true;
	Registries.Component.add(SaleOrderScreen);
	return SaleOrderScreen;
});
