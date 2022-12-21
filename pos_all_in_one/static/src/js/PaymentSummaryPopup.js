odoo.define('pos_all_in_one.PopupPaymentWidget', function(require) {
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');

	class PopupPaymentWidget extends Popup {
		constructor() {
            super(...arguments);
            this.render_payment_summary();
        }
        mounted(){
        	$('#dt_strt').hide();
			$('#dt_end').hide();
        }

  		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}


  		render_element() {
			var self = this;
			// super(...arguments);
			$('#dt_strt').hide();
			$('#dt_end').hide();

			$('#pymnt_crnt_ssn').click(function() {
				if ($('#pymnt_crnt_ssn').is(':checked')) {
					$('#strt_dt').hide();
					$('#end_dt').hide();
				}
				else{
					$('#strt_dt').show();
					$('#end_dt').show();
				}
			});

		}

		render_payment_summary(){
			$('#dt_strt').hide();
			$('#dt_end').hide();

			$('#pymnt_crnt_ssn').click(function() {
				if ($('#pymnt_crnt_ssn').is(':checked')) {
					$('#strt_dt').hide();
					$('#end_dt').hide();
				}
				else{
					$('#strt_dt').show();
					$('#end_dt').show();
				}
			});

			var self = this;
			var is_current_session = $('#pymnt_crnt_ssn').is(':checked')
			var pay_st_date = $('#pay_st_date').val()
			var pay_ed_date = $('#pay_ed_date').val()
			var smry_payment = $('#smry_payment').val()

			var order = this.env.pos.get_order();
			var curr_session = self.env.pos.config.current_session_id[0];
			var payment_summary = [];
			var cashier = this.env.pos.get_cashier();

			$('#dt_strt').hide();
			$('#dt_end').hide();

			if(is_current_session == true)
			{
				this.rpc({
					model: 'pos.report.payment',
					method: 'get_crnt_ssn_payment_pos_order',
					args: [1,smry_payment,cashier.user_id[0],curr_session,is_current_session,pay_st_date,pay_ed_date],
				}).then(function(data){
					var payments = data[2];
					payment_summary = data[1];
					var final_total = data[0];

					// self.gui.close_popup();
					self.trigger('close-popup');
					self.showScreen('PaymentReceiptWidget',{
						payment_summary:payment_summary,
						final_total:final_total,
						is_current_session:is_current_session,
						payments : payments,
						smry_payment : smry_payment,
					});
				});
			}
			else{
				if(!pay_st_date){
					$('#dt_strt').show()
					setTimeout(function() {$('#dt_strt').hide()},3000);
					return
				}
				else if(!pay_ed_date){
					$('#dt_end').show()
					setTimeout(function() {$('#dt_end').hide()},3000);
					return
				}
				else{

					this.rpc({
						model: 'pos.report.payment',
						method: 'get_crnt_ssn_payment_pos_order',
						args: [1,smry_payment,cashier.user_id[0],curr_session,is_current_session,pay_st_date,pay_ed_date],
					}).then(function(data){
						var payments = data[2];
						payment_summary = data[1];
						var final_total = data[0];

						// self.gui.close_popup();
						self.trigger('close-popup');
						self.showScreen('PaymentReceiptWidget',{
							payment_summary:payment_summary,
							final_total:final_total,
							is_current_session:is_current_session,
							payments : payments,
							start_date_pay:pay_st_date,
							end_date_pay:pay_ed_date,
							smry_payment : smry_payment,
						});
					});
					return
				}

			}
		}
	}
	PopupPaymentWidget.template = 'PopupPaymentWidget';
	PopupPaymentWidget.defaultProps = {
		confirmText: 'Print',
		cancelText: 'Cancel',
		title: 'Payment Summary',
		// body: 'Ordered qty of One or more product(s) is more than available qty.',
		};

	Registries.Component.add(PopupPaymentWidget);

	return PopupPaymentWidget;
});
