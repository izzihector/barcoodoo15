odoo.define('pos_all_in_one.PopupCategoryWidget', function(require) {
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');

	class PopupCategoryWidget extends Popup {
		mounted() {
			$('#categ_dt_strt').hide();
			$('#categ_dt_end').hide();
		}
		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}

		renderElement() {
			var self = this;
			
			$('#categ_dt_strt').hide();
			$('#categ_dt_end').hide();

			$('#categ_crnt_ssn').click(function() {
				if ($('#categ_crnt_ssn').is(':checked')) {
					$('#ct_st_dt').hide();
					$('#ct_end_dt').hide();
				}
				else{
					$('#ct_st_dt').show();
					$('#ct_end_dt').show();
				}
			});
			$('.print').click(function(){
				self.render_category_summary();
			});
		}

		render_category_summary(){
			var self = this;
			var categ_st_date = $('#categ_st_date').val()
			var categ_ed_date = $('#categ_ed_date').val()
			var category_summary = [];
			var curr_session = self.env.pos.config.current_session_id[0];
			var categ_current_session = $('#categ_crnt_ssn').is(':checked')
			$('#categ_dt_strt').hide();
			$('#categ_dt_end').hide();

			if(categ_current_session == true)	
			{
				this.rpc({
						model: 'pos.report.category', 
						method: 'get_category_pos_order', 
						args: [self.env.pos.order_sequence,categ_st_date,categ_ed_date,curr_session,categ_current_session], 
				}).then(function(data){ 
					category_summary = data;
					var make_total = [];
					var final_total = null;

					for(var i=0;i<category_summary.length;i++){
						make_total.push(category_summary[i].sum)
						final_total = make_total.reduce(function(acc, val) { return acc + val; });
					}
					self.trigger('close-popup');
					self.showScreen('CategoryReceiptWidget',{
						category_summary:category_summary,
						start_date_categ:categ_st_date,
						end_date_categ:categ_ed_date,
						final_total:final_total,
						categ_current_session:categ_current_session,
					});
				});
			}
			else{
				if(categ_st_date == false){
					$('#categ_dt_strt').show()
					setTimeout(function() {$('#categ_dt_strt').hide()},3000);
					return
				}
				else if(categ_ed_date == false){
					$('#categ_dt_end').show()
					setTimeout(function() {$('#categ_dt_end').hide()},3000);
					return
				}
				else{
					this.rpc({
						model: 'pos.report.category', 
						method: 'get_category_pos_order', 
						args: [self.env.pos.order_sequence,categ_st_date,categ_ed_date,curr_session,categ_current_session], 
					}).then(function(data){ 
						category_summary = data;
						var make_total = [];
						var final_total = null;

						for(var i=0;i<category_summary.length;i++){
							make_total.push(category_summary[i].sum)
							final_total = make_total.reduce(function(acc, val) { return acc + val; });
						}
						self.trigger('close-popup');
						self.showScreen('CategoryReceiptWidget',{
							category_summary:category_summary,
							start_date_categ:categ_st_date,
							end_date_categ:categ_ed_date,
							final_total:final_total,
							categ_current_session:categ_current_session,
						});
					});
				}
			}
		}
	}

	PopupCategoryWidget.template = 'PopupCategoryWidget';

	Registries.Component.add(PopupCategoryWidget);

	return PopupCategoryWidget;

});