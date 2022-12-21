odoo.define('pos_all_in_one.XMLPosPaymentSummaryReceipt', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class XMLPosPaymentSummaryReceipt extends PosComponent {
		constructor() {
			super(...arguments);
			this.render_payment_summary()
		}


		render_payment_summary(){
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
					// self.trigger('close-popup');
					self.get_payment_receipt_render_env();
				});
			}
			else{
				if(pay_st_date == false){
					$('#dt_strt').show()
					setTimeout(function() {$('#dt_strt').hide()},3000);
					return
				}
				else if(pay_ed_date == false){
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
						// self.trigger('close-popup');
						self.get_payment_receipt_render_env();
					});
					return self.get_payment_receipt_render_env();
				}

			}
		}

		get_payment_receipt_render_env() {
			var self = this;
			var is_current = this.env.pos.get_order().get_screen_data('is_current_session')
			var is_current_session =  is_current['props']['is_current_session']
			if(is_current_session == true)
			{
				return {
					widget: this,
					pos: this.env.pos,
					payments : is_current['props']['payments'],
					is_current_session:is_current_session,
					pay_summary: this.get_payment_summery(),
					final_total:this.get_payment_final_total(),
					date_pay: (new Date()).toLocaleString(),
					smry_payment : is_current['props']['smry_payment'],
				};

			}
			else{

				return {
					widget: this,
					pos: this.env.pos,
					is_current_session:is_current_session,
					pay_summary: this.get_payment_summery(),
					payments : is_current['props']['payments'],
					final_total:this.get_payment_final_total(),
					smry_payment : is_current['props']['smry_payment'],
					st_date_pay:this.get_payment_st_date(),
					ed_date_pay:this.get_payment_ed_date(),
					st_month_pay:this.get_payment_st_month(),
					ed_month_pay:this.get_payment_ed_month(),
					date_pay: (new Date()).toLocaleString(),
				};
			}

		}

		get_payment_summery(){
			var payment_summary=this.env.pos.get_order().get_screen_data('payment_summary')
			return payment_summary['props']['payment_summary'];
		}

		get_payment_final_total () {
			var final_total=this.env.pos.get_order().get_screen_data('final_total')
			return final_total['props']['final_total'];
		}

		get_payment_st_date (){
			var start_date_pay = this.env.pos.get_order().get_screen_data('start_date_pay')
			var st_date1 = start_date_pay['props']['start_date_pay']
			var st_date = st_date1.split("-")

			var st_date_d = st_date[2];
			var st_date_m = st_date[1];
			var st_date_y = st_date[0];
			var full_st_date = st_date_d+'-'+st_date_m+'-'+st_date_y
			return full_st_date;
		}

		get_payment_ed_date (){
			var end_date_pay = this.env.pos.get_order().get_screen_data('end_date_pay')
			var ed_date1 = end_date_pay['props']['end_date_pay']
			var ed_date = ed_date1.split("-")

			var ed_date_d = ed_date[2];
			var ed_date_m = ed_date[1];
			var ed_date_y = ed_date[0];
			var full_ed_date = ed_date_d+'-'+ed_date_m+'-'+ed_date_y
			return full_ed_date;
		}


		get_payment_st_month(){
			var start_date_pay = this.env.pos.get_order().get_screen_data('start_date_pay')
			var st_date1 = start_date_pay['props']['start_date_pay']
			var st_date = st_date1.split("-")

			var monthNames = ["",
				"January", "February", "March",
				"April", "May", "June", "July",
				"August", "September", "October",
				"November", "December"
			];

			var st_date_m_index = st_date[1];
			var st_date_split = st_date_m_index.split('')

			if(st_date_split[0] > '0'){
				st_date_m_index = st_date_m_index
			}else{
				st_date_m_index = st_date_m_index.split('')[1]
			}
			var st_date_y = st_date[0];

			return monthNames[st_date_m_index]+'-'+st_date_y;
		}

		get_payment_ed_month (){
			var end_date_pay = this.env.pos.get_order().get_screen_data('end_date_pay')
			var ed_date1 = end_date_pay['props']['end_date_pay']
			var ed_date = ed_date1.split("-")

			var monthNames = ["",
				"January", "February", "March",
				"April", "May", "June", "July",
				"August", "September", "October",
				"November", "December"
			];

			var ed_date_m_index = ed_date[1];

			var ed_date_split = ed_date_m_index.split('')
			if(ed_date_split[0] > '0'){
				ed_date_m_index = ed_date_m_index
			}else{
				ed_date_m_index = ed_date_m_index.split('')[1]
			}
			var ed_date_y = ed_date[0];

			return monthNames[ed_date_m_index]+'-'+ed_date_y;
		}
	}
	XMLPosPaymentSummaryReceipt.template = 'XMLPosPaymentSummaryReceipt';

	Registries.Component.add(XMLPosPaymentSummaryReceipt);

	return XMLPosPaymentSummaryReceipt;
});