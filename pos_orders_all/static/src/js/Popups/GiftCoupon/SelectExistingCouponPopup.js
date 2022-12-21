
odoo.define('pos_orders_all.SelectExistingCouponPopup', function(require){
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const { Gui } = require('point_of_sale.Gui');

	class SelectExistingCouponPopup extends AbstractAwaitablePopup {

		constructor() {
			super(...arguments);
		}

		GetFormattedDate(date) {
		    var month = ("0" + (date.getMonth() + 1)).slice(-2);
		    var day  = ("0" + (date.getDate())).slice(-2);
		    var year = date.getFullYear();
		    var hour =  ("0" + (date.getHours())).slice(-2);
		    var min =  ("0" + (date.getMinutes())).slice(-2);
		    var seg = ("0" + (date.getSeconds())).slice(-2);
		    return year + "-" + month + "-" + day + " " + hour + ":" +  min + ":" + seg;
		}

		async apply_coupon () {
			let self = this;
			let order = this.env.pos.get_order();
			if(order){
				let orderlines = order.get_orderlines();
				let selectedOrder = self.env.pos.get('selectedOrder');
				// $('#apply_coupon_code').click(function() {
				let entered_code = $("#existing_coupon_code").val();
				let partner_id;
				let coupon_applied = true;
				let used = false;
				if (order.get_client() != null){
					partner_id = order.get_client();
				}
				let total_amount = selectedOrder.get_total_without_tax();
				await self.rpc({
					model: 'pos.gift.coupon',
					method: 'search_coupon',
					args: [1, entered_code],
				
				}).then(function(output) {
					if(output.length > 0)
					{
						let amount = output[1];
						used = output[2];
						let coupon_count = output[3];
						let coupon_times = output[4];
						let expiry = output[5];
						expiry +=' UTC'
						let partner_true = output[6];
						let gift_partner_id = output[7];
						let amount_type = output[8]
						let exp_dt_true = output[9];
						let max_amount = output[10];
						let apply_coupon_on = output[11];
						let current_date = new Date().toUTCString();
						let d = new Date();
						let new_d = self.GetFormattedDate(d);
						let month = '0' + (d.getMonth() + 1);
						let day = '0' + d.getDate();
						let year = d.getFullYear();
						let product_id = output[12];
						let is_categ = output[13];
						let categ_ids = output[14];
						let categ_amount = 0.0;
						let order_total = order.get_total_with_tax();
						let categ_total = 0;
						let new_expiry = new Date(expiry);
						let new_date = self.GetFormattedDate(new_expiry);
						let date = new Date(year,month,day);
						if(amount_type == 'per'){
							if(apply_coupon_on == 'taxed')
							{
								total_amount = order.get_total_with_tax();
							}
							amount = (total_amount * output[1])/100;
						}else{
							amount = amount;
						}

						if(categ_ids.length > 0 && is_categ){
							orderlines.forEach(function (line) {
								categ_ids.forEach(function (c_id) {
									if(line.product.pos_categ_id){
										if(line.product.pos_categ_id[0] == c_id){
											if(amount_type == 'per'){
												if(apply_coupon_on == 'taxed')
												{
													let tt =  parseFloat(line.get_tax() + line.get_display_price())
													categ_amount += (tt * output[1])/100;
												}
												else{
													categ_amount +=  (line.get_base_price() * output[1])/100;
												}
											}else{
												categ_amount =  output[1];
											}
											categ_total +=  parseFloat(line.get_tax() + line.get_display_price());
										}
									}
								});
							});
							amount = categ_amount;
							order_total = categ_total;
						}
						if (exp_dt_true && new_d > new_date){
							Gui.showPopup('ErrorPopup', {
								'title': self.env._t('Expired'),
								'body': self.env._t("The Coupon You are trying to apply is Expired"),
							});	
						}
						else if (coupon_count > coupon_times){ // maximum limit
							Gui.showPopup('ErrorPopup', {
								'title': self.env._t('Maximum Limit Exceeded !!!'),
								'body': self.env._t("You already exceed the maximum number of limit for this Coupon code"),
							});
						}
						
						else if (partner_true == true && gift_partner_id != partner_id.id){
							Gui.showPopup('ErrorPopup', {
								'title': self.env._t('Invalid Customer !!!'),
								'body': self.env._t("This Gift Coupon is not applicable for this Customer"),
							});
						}

						else if(order_total < amount){
							Gui.showPopup('ErrorPopup', {
								'title': self.env._t('Invalid Amount !!!'),
								'body':self.env._t("Coupon Amount is greater than order amount"),
							});
						}

						else if(amount <= 0 ){
							Gui.showPopup('ErrorPopup', {
								'title': self.env._t('Invalid Amount !!!'),
								'body':self.env._t("Coupon is not applicable here."),
							});
						}
						else { 
							if(max_amount >= amount){
								let update_coupon_amount = max_amount - amount
								order.coup_maxamount = update_coupon_amount;
								let total_val = total_amount - amount;
								let product = self.env.pos.db.get_product_by_id(product_id);
								if(product == undefined){
									Gui.showPopup('ErrorPopup', {
										'title': self.env._t('Product Not Available !!!'),
										'body': self.env._t("Product Not available in POS."),
									});
								}else{
									let selectedOrder = self.env.pos.get('selectedOrder');
									selectedOrder.add_product(product, {
										price: -amount,
										quantity: 1.0,
									});
									order.set_is_coupon_used(true);
									order.coupon_id = output[0];
									self.trigger('close-popup');
								}
							}else{
								Gui.showPopup('ErrorPopup', {
									'title': self.env._t('Discount Limit Exceeded !!!'),
									'body': self.env._t("Discount amount is higher than maximum amount of this coupon."),
								});
							}
						}
					}else { //Invalid Coupon Code
						Gui.showPopup('ErrorPopup', {
							'title': self.env._t('Invalid Code !!!'),
							'body': self.env._t("Voucher Code Entered by you is Invalid. Enter Valid Code..."),
						});
					}
				});					
			}
		}
	};
	
	SelectExistingCouponPopup.template = 'SelectExistingCouponPopup';

	Registries.Component.add(SelectExistingCouponPopup);

	return SelectExistingCouponPopup;

});