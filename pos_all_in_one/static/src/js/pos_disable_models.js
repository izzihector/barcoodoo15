// pos_all_in_one js
odoo.define('pos_all_in_one.disable_models', function(require) {
	"use strict";

	const models = require('point_of_sale.models');
	const screens = require('point_of_sale.ProductScreen');
	const core = require('web.core');
	const gui = require('point_of_sale.Gui');
	const QWeb = core.qweb;
	const session = require('web.session');
	const rpc = require('web.rpc');
	const chrome = require('point_of_sale.Chrome');
	const _t = core._t;

	models.load_models([{
		model:  'res.users',
		fields: ['name','company_id', 'id', 'groups_id', 'lang','is_allow_payments','is_allow_discount',
			'is_allow_qty','is_edit_price','is_allow_remove_orderline'],
		domain: function(self){ return [['company_ids', 'in', self.config.company_id[0]],'|', ['groups_id','=', self.config.group_pos_manager_id[0]],['groups_id','=', self.config.group_pos_user_id[0]]]; },
		loaded: function(self, users) {

            users.forEach(function(user) {
                user.role = 'cashier';
                user.groups_id.some(function(group_id) {
                    if (group_id === self.config.group_pos_manager_id[0]) {
                        user.role = 'manager';
                        return true;
                    }
                });
                if (user.id === self.session.uid) {
                    self.user = user;
                    self.employee.name = user.name;
                    self.employee.role = user.role;
                    self.employee.user_id = [user.id, user.name];
					self.employee.is_allow_payments = user.is_allow_payments;
					self.employee.is_allow_qty = user.is_allow_qty;
					self.employee.is_allow_discount = user.is_allow_discount;
					self.employee.is_edit_price = user.is_edit_price;
					self.employee.is_allow_remove_orderline = user.is_allow_remove_orderline;
                }
            });
            self.users = users;
            self.employees = [self.employee];
            self.set_cashier(self.employee);
		}
	}]);


	models.load_models([{
		model:  'hr.employee',
		fields: ['name', 'id', 'user_id','is_allow_payments','is_allow_discount',
			'is_allow_qty','is_edit_price','is_allow_remove_orderline'],
        domain: function(self) {return [['company_id', '=', self.company && self.company.id || false]]},
		loaded: function(self, employees) {
			if (self.config.module_pos_hr) {
				if (self.config.employee_ids.length > 0) {
					self.employees = employees.filter(function(employee) {
						return self.config.employee_ids.includes(employee.id) || employee.user_id[0] === self.user.id;
					});
				} else {
					self.employees = employees;
				}
				
				self.employees.forEach(function(employee) {
					let hasUser = self.users.some(function(user) {
						if (user.id === employee.user_id[0]) {
							employee.role = user.role;
							employee.is_allow_payments = user.is_allow_payments;
							employee.is_allow_qty = user.is_allow_qty;
							employee.is_allow_discount = user.is_allow_discount;
							employee.is_edit_price = user.is_edit_price;
							employee.is_allow_remove_orderline = user.is_allow_remove_orderline;
							return true;
						}
						return false;
					});
					if (!hasUser) {
						employee.role = 'cashier';
					}
				});
			}
		}
	}]);


	var OrderlineSuper = models.Orderline;
	models.Orderline = models.Orderline.extend({
		set_quantity: function(quantity, keep_price){
			let self = this;
			this.order.assert_editable();
			let cashier = this.pos.get_cashier();
			if(!quantity || quantity === 'remove' || quantity == 0){
				if('is_allow_remove_orderline' in cashier){
					if (cashier.is_allow_remove_orderline) {
						const rslt = OrderlineSuper.prototype.set_quantity.apply(this, arguments);
						return rslt;
					}
					else{
						alert("Sorry,You have no access to remove orderline");
					}
				}
				else{
					const rslt = OrderlineSuper.prototype.set_quantity.apply(this, arguments);
					return rslt;
				}
			}
			else{
				if(quantity == 1){
					const rslt = OrderlineSuper.prototype.set_quantity.apply(this, arguments);
					return rslt;
				}
				else{
					if('is_allow_qty' in cashier){
						if (cashier.is_allow_qty) {
							const rslt = OrderlineSuper.prototype.set_quantity.apply(this, arguments);
							return rslt;
						}
						else{
							alert("Sorry,You have no access to change quantity");
						}
					}
					else{
						const rslt = OrderlineSuper.prototype.set_quantity.apply(this, arguments);
						return rslt;
					}

				}
				
			}
		}, 
	});

	var OrderSuper = models.Order;
	models.Order = models.Order.extend({
		remove_orderline: function( line ){
			let self = this;
			let cashier = this.pos.get_cashier();
			this.redeem_done = false;
			if(line.id ==this.get('remove_line'))
			{
				this.set('remove_true', true);
				let partner = this.get_client();
				if (partner) {
					partner.loyalty_points = parseInt(partner.loyalty_points) + parseInt(this.get('redeem_point')) ;
				}
			}
			else
			{
				this.set('remove_true', false);
			}
			if('is_allow_remove_orderline' in cashier){
				if (cashier.is_allow_remove_orderline) {
					let prod = line.product;
					if(prod && prod.is_coupon_product){
						this.set_is_coupon_used(false);
					}
					this.coupon_id = false;	
					this.assert_editable();
					this.orderlines.remove(line);
					this.select_orderline(this.get_last_orderline());
				}
				else{
					alert("Sorry,You have no access to remove orderline");
				}
			}
			
		},
	});
});
