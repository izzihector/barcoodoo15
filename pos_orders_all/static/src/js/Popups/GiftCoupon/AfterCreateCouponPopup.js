
odoo.define('pos_orders_all.AfterCreateCouponPopup', function(require){
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');

	class AfterCreateCouponPopup extends AbstractAwaitablePopup {
		constructor() {
            super(...arguments);
            this.show();
        }

		show(options) {
			let self = this;
			self.render_coupon(options)
		}

	    print_gift_coupon(ev) {
			let self = this;
			ev.stopPropagation();
			ev.preventDefault();   
			self.env.pos.set('coupon_print_data', this.coupon_data);
			self.trigger('close-popup')
			self.showScreen('CouponReceiptScreen',{'data' : this.coupon_data});
		}

		render_coupon(options) {
			let self = this;
			let partner_id = false;
			let order = this.env.pos.get_order();
			if(order){
				let coupon_datails = false;
				if (order.get_client() != null){
					partner_id = order.get_client();
				}
				coupon_datails =  this.props.output;
				let coup_id = coupon_datails[0];
				let coup_name = coupon_datails[1];
				let coup_exp_dt = false;
				if(coupon_datails[2])
				{
					coup_exp_dt = coupon_datails[2].split(" ")[0];
				}
				let coup_issue_dt = coupon_datails[4];
				coup_issue_dt = coup_issue_dt.split(" ")[0];

				let coup_amount = coupon_datails[3];
				let coup_img = coupon_datails[7];
				let am_type = coupon_datails[6];
				let coup_code = coupon_datails[5];
				
				let coup_dict = {coup_id,coup_name,coup_exp_dt,coup_issue_dt,coup_amount,coup_img,am_type,coup_code}
				if(coup_dict){
					this.coupon_data = coup_dict
				}
			}
		}
		
		print_web() {
			window.print();
		}
	};
	
	AfterCreateCouponPopup.template = 'AfterCreateCouponPopup';

	Registries.Component.add(AfterCreateCouponPopup);

	return AfterCreateCouponPopup;

});