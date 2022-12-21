odoo.define('pos_orders_all.CreateCouponPopup', function(require){
	'use strict';

	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');
	const { useListener } = require('web.custom_hooks');
	const rpc = require('web.rpc');
	let core = require('web.core');
	let _t = core._t;


	class CreateCouponPopupWidget extends AbstractAwaitablePopup {

		constructor() {
			super(...arguments);
			useListener('click-c_cust_box', this.coupon_cust_box);
			useListener('click-c_expdt_box', this.coupon_expdt_box);
		}

		get categories(){
			let ctg = this.env.pos.db.category_by_id;
			let categ = [];
			$.each(ctg, function( i, ct ){
				if(ct.name != 'Root'){
					categ.push(ct)
				}
			});
			return categ;
		}

		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}	

		coupon_cust_box(ev) {
			if ($('#c_cust_box').is(':checked')) {
				$('#coupon_customer').show();
			} else {
				$('#coupon_customer').hide();
			}
		}

		coupon_expdt_box(ev){
			if ($('#coupon_expdt_box').is(':checked')) {
				$('#coupon_exp_dt').show();
			} else {
				$('#coupon_exp_dt').hide();
			}
		}

		_CoupAmountType(ev){
			if(ev.target.value == 'Percentage'){
				$('#apply_coupon_type').show();
			}
			else{
				$('#apply_coupon_type').hide();
			}
		}

		mounted () {
			let self = this;
			let order = this.env.pos.get_order();
			if(order){
				let selectedOrder = self.env.pos.get('selectedOrder');
				$('#coupon_exp_dt').hide();
				$('#coupon_customer').hide();
				$('#apply_coupon_type').hide();
			}

			$('#coupon_categ').multiselect({
				columns: 1,
				placeholder: 'Select POS Categories',
				search: true,
				selectAll: true
			});
		}


		create_coupon(){
			let self = this;
			let order = this.env.pos.get_order();
			if(order){
				let coupon_categ = $('#coupon_categ').val();
				let apply_coupon_on = $('#apply_coupon_on').val();
				let c_name = $("#coupon_name").val();
				let c_product = $("#coupon_product").val();
				let c_limit = $("#coupon_limit").val();
				let c_amount = $("#coupon_amount").val();
				let c_am_type = $("#coup_amount_type").val();
				let c_customer = $("#coupon_customer").val();
				let c_issue_dt = $("#coupon_issue_dt").val();
				let c_exp_dt = $("#coupon_exp_dt").val();
				let c_max_amount = $("#coupon_max_amount").val();
				let c_cust_box = $("#c_cust_box").is(':checked');
				let c_categs = $("#coupon_max_amount").val();
				let c_expdt_box = $('#coupon_expdt_box').is(':checked');
				let exp_dt = new Date(c_exp_dt);
				let issu_dt = new Date(c_issue_dt);

				if(!c_name){
					self.showPopup('CreateCouponPopupWidget',{});
					$('#error_text').text('Please add name of coupon');
					setTimeout(function() {$('#error_text').text(' ')},2000);
				}
				else if(!c_product){
					self.showPopup('CreateCouponPopupWidget',{});
					$('#error_text').html('Please add product');
					setTimeout(function() {$('#error_text').html(' ')},2000);
				}
				else if(!c_amount){
					self.showPopup('CreateCouponPopupWidget',{});
					$('#error_text').html('Please enter coupon amount');
					setTimeout(function() {$('#error_text').html(' ')},2000);
				}
				else if((c_am_type == 'Fixed') && (c_max_amount) && (parseInt(c_max_amount) < parseInt(c_amount))){
					self.showPopup('CreateCouponPopupWidget',{});
					$('#error_text').html('Coupon amount is greater than maximum amount');
					setTimeout(function() {$('#error_text').html(' ')},2000);
				}
				else if(!c_issue_dt){
					self.showPopup('CreateCouponPopupWidget',{});
					$('#error_text').html('Please select issue date');
					setTimeout(function() {$('#error_text').html(' ')},2000);
				}
				else if( c_issue_dt && c_exp_dt && exp_dt.getTime() < issu_dt.getTime()){
					self.showPopup('CreateCouponPopupWidget',{});
					$('#error_text').html('Please Enter Valid Date.Expiry Date Should not be greater than Issue Date.');
					setTimeout(function() {$('#error_text').html(' ')},2000);
				}
				else{
					
					let dict ={
						'c_name':c_name,
						'c_product':c_product,
						'c_limit': c_limit,
						'c_amount':c_amount,
						'c_am_type':c_am_type,
						'c_customer':c_customer,
						'c_issue_dt':c_issue_dt,
						'c_exp_dt':c_exp_dt,
						// 'user_id':order.user_id,
						'coupon_max_amount':c_max_amount,
						'c_expdt_box':c_expdt_box,
						'c_cust_box':c_cust_box,
						'coupon_categ':coupon_categ,
						'apply_coupon_on':apply_coupon_on,
					}
					this.rpc({
						model: 'pos.gift.coupon',
						method: 'create_coupon_from_ui',
						args: [dict],
					}).then(function(output) {
						self.trigger('close-popup');
						self.showPopup('AfterCreateCouponPopup',{output})
					})
				}
			}
		}
	};
	
	CreateCouponPopupWidget.template = 'CreateCouponPopupWidget';

	Registries.Component.add(CreateCouponPopupWidget);

	return CreateCouponPopupWidget;

});