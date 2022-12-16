odoo.define('pos_all_in_one.LoyaltyButtonWidget', function(require) {
	"use strict";

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require('web.custom_hooks');
	const Registries = require('point_of_sale.Registries');

	class LoyaltyButton extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}
		async onClick() {
			let order = this.env.pos.get_order();
			let self = this;
			let partner = false;
			let loyalty_points = 0;
			if(order.orderlines.length>0)
			{
				if(this.env.pos.pos_loyalty_setting.length != 0)
				{
					if (order.get_client() != null){
						partner = order.get_client();
						loyalty_points = partner.loyalty_points;
					}
										
					if(order.redeem_done){
						this.showPopup('ErrorPopup',{
							'title': this.env._t('Redeem Product'),
							'body': this.env._t('Sorry, you already added the redeem product.'),
						}); 
					}
					else if(this.env.pos.pos_loyalty_setting[0].redeem_ids.length == 0)
					{
						this.showPopup('ErrorPopup', {
							'title': this.env._t('No Redemption Rule'),
							'body': this.env._t('Please add Redemption Rule in loyalty configuration'),
						}); 
					}
					else if(!partner){
						this.showPopup('ErrorPopup', {
							'title': this.env._t('Unknown customer'),
							'body': this.env._t('You cannot redeem loyalty points. Select customer first.'),
						});
					}
					else if(loyalty_points < 1){
						this.showPopup('ErrorPopup', {
							'title': this.env._t('Insufficient Points'),
							'body': this.env._t('Sorry, you do not have sufficient loyalty points.'),
						});
					}
					else{
						this.showPopup('LoyaltyPopupWidget', {'partner':partner});
					} 
				}    
			}
			else{
				this.showPopup('ErrorPopup', {
					'title': this.env._t('Empty Order'),
					'body': this.env._t('Please select some products'),
				}); 
			}		  
		}
	}
	LoyaltyButton.template = 'LoyaltyButton';

	ProductScreen.addControlButton({
		component: LoyaltyButton,
		condition: function() {
			if(this.env.pos.pos_loyalty_setting.length > 0){
				return true;
			}else{
				return false;
			}
		},
	});

	Registries.Component.add(LoyaltyButton);

	return LoyaltyButton;

});
