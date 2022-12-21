odoo.define('pos_all_in_one.XMLPosCategorySummaryReceipt', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class XMLPosCategorySummaryReceipt extends PosComponent {
		constructor() {
			super(...arguments);
			this.render_category_summary()
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
					// self.trigger('close-popup');
					self.get_category_receipt_render_env();
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
						// self.trigger('close-popup');
						self.get_category_receipt_render_env();
					});
				}
			}
		}


		get_category_receipt_render_env() {
			var self = this;
			var is_current = this.env.pos.get_order().get_screen_data('categ_current_session')
			var categ_current_session = is_current['props']['categ_current_session'];
			if(categ_current_session == true)
			{
				return {
					widget: this,
					pos: this.pos,
					categ_current_session : categ_current_session ,
					cate_summary: this.get_category_summery(),
					final_total:this.get_category_final_total(),
					date_c: (new Date()).toLocaleString()
				};
			}
			else{
				return {
					widget: this,
					pos: this.pos,
					categ_current_session : categ_current_session ,
					cate_summary: this.get_category_summery(),
					st_date_categ:this.get_category_st_date(),
					ed_date_categ:this.get_category_ed_date(),
					st_month_categ:this.get_category_st_month(),
					ed_month_categ:this.get_category_ed_month(),
					final_total:this.get_category_final_total(),
					date_c: (new Date()).toLocaleString()
				};
			}
			
		}

		get_category_summery(){
			var category_summary = this.env.pos.get_order().get_screen_data('category_summary')
			return category_summary['props']['category_summary']; 
		}

		get_category_st_date(){
			var start_date_categ = this.env.pos.get_order().get_screen_data('start_date_categ')
			var st_date = start_date_categ['props']['start_date_categ'].split("-")
			
			var st_date_d = st_date[2];
			var st_date_m = st_date[1];
			var st_date_y = st_date[0];
			var full_st_date = st_date_d+'-'+st_date_m+'-'+st_date_y
			return full_st_date; 
		}
		get_category_ed_date(){
			var end_date_categ = this.env.pos.get_order().get_screen_data('end_date_categ')
			var ed_date = end_date_categ['props']['end_date_categ'].split("-")

			var ed_date_d = ed_date[2];
			var ed_date_m = ed_date[1];
			var ed_date_y = ed_date[0];
			var full_ed_date = ed_date_d+'-'+ed_date_m+'-'+ed_date_y
			return full_ed_date;
		}

		get_category_st_month(){
			var start_date_categ = this.env.pos.get_order().get_screen_data('start_date_categ')
			var st_date = start_date_categ['props']['start_date_categ'].split("-")
			
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

		get_category_ed_month(){
			var end_date_categ = this.env.pos.get_order().get_screen_data('end_date_categ')
			var ed_date = end_date_categ['props']['end_date_categ'].split("-")

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

		get_category_final_total(){
			var final_total = this.env.pos.get_order().get_screen_data('final_total')
			return final_total['props']['final_total']; 
		}


	}
	XMLPosCategorySummaryReceipt.template = 'XMLPosCategorySummaryReceipt';

	Registries.Component.add(XMLPosCategorySummaryReceipt);

	return XMLPosCategorySummaryReceipt;
});
