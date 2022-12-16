odoo.define('pos_orders_all.POSOrdersScreen', function (require) {
	'use strict';

	const { debounce } = owl.utils;
	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');
	const { onChangeOrder } = require('point_of_sale.custom_hooks');
	const field_utils = require('web.field_utils');

	class POSOrdersScreen extends PosComponent {
		constructor() {
			super(...arguments);
			this.state = {
				query: null,
				selectedPosOrder: this.props.client,
			};
			useListener('click-showDetails', this.showDetails);
			useListener('click-reorder', this.clickReOrder);
			useListener('click-reprint', this.clickReprint);
			useListener('click-returnOrder', this.clickReturnOrder);
			this.orders = this.get_pos_orders()[0] || [];
			this.orderlines = this.get_pos_orders()[1] || [];
			this.updateOrderList = debounce(this.updateOrderList, 70);
		}

		back() {
			this.props.resolve({ confirmed: false, payload: false });
			this.trigger('close-temp-screen');
		}

		get currentOrder() {
			return this.env.pos.get_order();
		}

		get pos_orders() {
			let self = this;
			let query = this.state.query;
			if(query){
				query = query.trim();
				query = query.toLowerCase();
			}
			if(this.orders){
				if ((query && query !== '') || 
					(this.props.selected_partner_id)) {
					return this.search_orders(this.orders,query);
				} else {
					return this.orders;
				}
			}
			else{
				let odrs = this.get_pos_orders()[0] || [];
				if (query && query !== '') {
					return this.search_orders(odrs,query);
				} else {
					return odrs;
				}
			}
		}

		get pos_order_lines() {
			return this.orderlines;
		}

		clickReOrder(event){
			let self = this;
			let order = event.detail;
			let o_id = parseInt(event.detail.id);
			let orderlines =  self.orderlines;				
			let pos_lines = [];

			for(let n=0; n < orderlines.length; n++){
					if (orderlines[n]['order_id'][0] ==o_id){
						pos_lines.push(orderlines[n])
				}
			}
			self.showPopup('ReOrderPopup', {
				'order': event.detail, 
				'orderlines':pos_lines,
			});
		}

		async clickReprint(event){
			let self = this;
			let order = event.detail;

			await self.rpc({
				model: 'pos.order',
				method: 'print_pos_receipt',
				args: [order.id],
			}).then(function(output) {
				let data = output;
				data['order'] = order;
				data['order']['date_order'] = output.date_order
				self.showTempScreen('OrderReprintScreen',data);
			});
		}

		clickReturnOrder(event){
			let self = this;
			let order = event.detail;
			let o_id = parseInt(event.detail.id);
			let orderlines =  self.orderlines;				
			let pos_lines = [];

			for(let n=0; n < orderlines.length; n++){
				if (orderlines[n]['order_id'][0] ==o_id){
					pos_lines.push(orderlines[n])
				}
			}
			self.showPopup('ReturnOrderPopup', {
				'order': event.detail, 
				'orderlines':pos_lines,
			});
		}

		search_orders(orders,query){
			let self = this;
			let selected_orders = [];
			let search_text = query;
			let selected_partner = self.props.selected_partner_id;
			orders.forEach(function(odr) {
				if ((odr.partner_id == '' || !odr.partner_id) && search_text) {
					if (((odr.name.toLowerCase()).indexOf(search_text) != -1) || 
						((odr.state.toLowerCase()).indexOf(search_text) != -1)|| 
						((odr.pos_reference.toLowerCase()).indexOf(search_text) != -1)) {
						selected_orders.push(odr);
					}
				}
				else
				{
					if(search_text){
						if (((odr.name.toLowerCase()).indexOf(search_text) != -1) || 
							((odr.state.toLowerCase()).indexOf(search_text) != -1)|| 
							((odr.pos_reference.toLowerCase()).indexOf(search_text) != -1)|| 
							((odr.partner_id[1].toLowerCase()).indexOf(search_text) != -1)) {
							selected_orders.push(odr);
						}
					}
					
					if(selected_partner){
						if (odr.partner_id[0] == selected_partner){
							selected_orders.push(odr);
						}
					}
				}
			});
			return selected_orders;
		}

		refresh_orders(){
			$('.input-search-orders').val('');
			this.state.query = '';
			this.props.selected_partner_id = false;
			const pos_orders = this.pos_orders;
			this.render();
		}

		updateOrderList(event) {
			this.state.query = event.target.value;
			const pos_orders = this.pos_orders;
			if (event.code === 'Enter' && pos_orders.length === 1) {
				this.state.selectedPosOrder = pos_orders[0];
			} else {
				this.render();
			}
		}

		clickPosOrder(event) {
			let order = event.detail.order;
			if (this.state.selectedPosOrder === order) {
				this.state.selectedPosOrder = null;
			} else {
				this.state.selectedPosOrder = order;
			}
			this.render();
		}

		get_current_day() {
			let today = new Date();
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
			let current = self.env.pos.pos_session.id;
			let pos_config = self.env.pos.config;

			if (pos_config.pos_session_limit == 'all')
			{
				if(pos_config.show_draft == true)
				{
					if(pos_config.show_posted == true)
					{
						return [['state', 'in', ['draft','done']]]; 
					}
					else{
						return [['state', 'in', ['draft']]]; 
					}
				}
				else if(pos_config.show_posted == true)
				{
					return [['state', 'in', ['done']]];
				}
				else{
					return [['state', 'in', ['draft','done','paid','invoiced','cancel']]]; 
				}	
			}
			if (pos_config.pos_session_limit == 'last3')
			{
				if(pos_config.show_draft == true)
				{
					if(pos_config.show_posted == true)
					{
						return [['state', 'in', ['draft','done']],['session_id', 'in',[current,current-1,current-2,current-3]]]; 
					}
					else{
						return [['state', 'in', ['draft']],['session_id', 'in',[current,current-1,current-2,current-3]]]; 
					}
				}
				else if(pos_config.show_posted == true)
				{
					return [['state', 'in', ['done']],['session_id', 'in',[current,current-1,current-2,current-3]]];
				}
				else{
					return [['session_id', 'in',[current,current-1,current-2,current-3]]]; 
				}
			}
			if (pos_config.pos_session_limit == 'last5')
			{
				if(pos_config.show_draft == true)
				{
					if(pos_config.show_posted == true)
					{
						return [['state', 'in', ['draft','done']],['session_id', 'in',[current,current-1,current-2,current-3,current-4,current-5]]]; 
					}
					else{
						return [['state', 'in', ['draft']],['session_id', 'in',[current,current-1,current-2,current-3,current-4,current-5]]]; 
					}
				}
				else if(pos_config.show_posted == true)
				{
					return [['state', 'in', ['done']],['session_id', 'in',[current,current-1,current-2,current-3,current-4,current-5]]];
				}
				else{
					return [['session_id', 'in',[current,current-1,current-2,current-3,current-4,current-5]]]; 
				}
			}
			
			if (pos_config.pos_session_limit == 'current_session')
			{
				if(pos_config.show_draft == true)
				{
					if(pos_config.show_posted == true)
					{
						return [['state', 'in', ['draft','done']],['session_id', 'in',[current]]]; 
					}
					else{
						return [['state', 'in', ['draft']],['session_id', 'in',[current]]]; 
					}
				}
				else if(pos_config.show_posted == true)
				{
					return [['state', 'in', ['done']],['session_id', 'in',[current]]];
				}
				else{
					return [['session_id', 'in',[current]]]; 
				}
			}
		}

		async get_pos_orders () {
			let self = this;
			let pos_domain = self.get_orders_domain() || [];
			let load_orders = [];
			let load_orders_line = [];
			let order_ids = [];
			try {
				await self.rpc({
					model: 'pos.order',
					method: 'search_read',
					args: [pos_domain],
				}).then(function(output) {
					if (self.env.pos.config.pos_session_limit == 'current_day')
					{
						let today = self.get_current_day();
						output.forEach(function(i) {
							if(today == i.pos_order_date)
							{
								load_orders.push(i);
							}
						});
					}
					else{
						load_orders = output;
					}
					self.env.pos.db.get_orders_by_id = {};
					self.env.pos.db.get_orders_by_barcode = {};
					load_orders.forEach(function(order) {
						order_ids.push(order.id)
						self.env.pos.db.get_orders_by_id[order.id] = order;		
						self.env.pos.db.get_orders_by_barcode[order.barcode] = order;						
					});

					
					let fields_domain = [['order_id','in',order_ids]];
					self.rpc({
						model: 'pos.order.line',
						method: 'search_read',
						args: [fields_domain],
					}).then(function(output1) {
						self.env.pos.db.all_orders_line_list = output1;
						load_orders_line = output1;
						self.env.pos.set({'all_orders_list' : load_orders});
						self.env.pos.set({'all_orders_line_list' : output1});
						self.orders = load_orders;
						self.orderlines = output1;

						self.env.pos.db.get_orderline_by_id = {};
						output1.forEach(function(ol) {
							self.env.pos.db.get_orderline_by_id[ol.id] = ol;						
						});

						self.render();
						return [load_orders,load_orders_line]
					});
				}); 
			}catch (error) {
				if (error.message.code < 0) {
					await this.showPopup('OfflineErrorPopup', {
						title: this.env._t('Offline'),
						body: this.env._t('Unable to load orders.'),
					});
				} else {
					throw error;
				}
			}
		}

		showDetails(event){
			let self = this;
			let o_id = parseInt(event.detail.id);
			let orders =  self.orders;
			let orderlines =  self.orderlines;
			let orders1 = [event.detail];
			
			let pos_lines = [];

			for(let n=0; n < orderlines.length; n++){
				if (orderlines[n]['order_id'][0] ==o_id){
					pos_lines.push(orderlines[n])
				}
			}
			self.showPopup('PosOrdersDetail', {
				'order': event.detail, 
				'orderline':pos_lines,
			});
		}
	}


	POSOrdersScreen.template = 'POSOrdersScreen';
	POSOrdersScreen.hideOrderSelector = true;
	Registries.Component.add(POSOrdersScreen);
	return POSOrdersScreen;
});
