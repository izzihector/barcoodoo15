
odoo.define('pos_orders_all.CouponConfigPopup', function(require){
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');

	class CouponConfigPopup extends AbstractAwaitablePopup {

		constructor() {
            super(...arguments);
            // this.renderElement();
        }

		create_coupon(){
			var order = this.env.pos.get_order();
			if(order){
				var orderlines = order.get_orderlines();
				var self = this;
				if(order.get_is_coupon_used() == undefined){
					order.is_coupon_used = false;
				}
				self.trigger('close-popup');
				self.showPopup('CreateCouponPopupWidget',{});
			}
		}

		select_coupon(){
			var order = this.env.pos.get_order();
			if(order){
				var orderlines = order.get_orderlines();
				var self = this;
				if(order.get_is_coupon_used() == undefined){
					order.is_coupon_used = false;
				}				
				
				if(order.is_coupon_used == true){
					self.showPopup('ErrorPopup',{
						'title': this.env._t('Already Used !!!'),
						'body': this.env._t("You have already use Coupon code, at a time you can use one coupon in a Single Order"),
					});
				}
				else if (order.get_client() == null){
					self.showPopup('ErrorPopup', {
						'title': this.env._t('Unknown customer'),
						'body': this.env._t('You cannot use Coupons/Gift Voucher. Select customer first.'),
					});
					return;
				} 
				else if (orderlines.length === 0) {
					self.showPopup('ErrorPopup', {
						'title': this.env._t('Empty Order'),
						'body': this.env._t('There must be at least one product in your order before it can be apply for voucher code.'),
					});
					return;
				}
				else{
					self.showPopup('SelectExistingCouponPopup', {});
				}
				
			}
		}
	};
	
	CouponConfigPopup.template = 'CouponConfigPopup';

	Registries.Component.add(CouponConfigPopup);

	return CouponConfigPopup;

});