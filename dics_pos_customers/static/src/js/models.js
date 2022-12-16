odoo.define("dics_pos_customers.Models", function (require) {
    "use strict";

var models = require("point_of_sale.models");
const ClientListScreen = require('point_of_sale.ClientListScreen')
const Registries = require("point_of_sale.Registries");
var DB = require("point_of_sale.DB");
var utils = require('web.utils');

models.load_fields("res.partner", ["is_pos_customer"]);
models.load_fields("pos.config", ["pos_logo"]);

// this code will add logo based on  config
var _super_Order = models.Order.prototype;
models.Order = models.Order.extend({
    get_receipt_logo_url: function () {
        return window.location.origin + "/web/image?model=pos.config&field=pos_logo&id=" + this.pos.config.id;
    },
    export_for_printing: function () {
        var receipt = _super_Order.export_for_printing.apply(this, arguments);
        var order = this.pos.get_order();
        receipt["receipt_logo_url"] = order.get_receipt_logo_url();
        return receipt;
    },
});

// this code is add selected customer based on available pos checkbox
DB.include({
        init: function (options) {
            this._super(options);
        },
        search_visible_partner: function (query) {
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g, '.');
                query = query.replace(/ /g, '.+');
                var re = RegExp("([0-9]+):.*?" + utils.unaccent(query), "gi");
            } catch (e) {
                return [];
            }
            var results = [];
            for (var i = 0; i < this.limit; i++) {
                var r = re.exec(this.partner_search_string);
                if (r) {
                    var id = Number(r[1]);
                    var customer = this.get_partner_by_id(id)
                    if (customer.is_pos_customer) {
                        results.push(customer);
                    }
                } else {
                    break;
                }
            }
            return results
        },
    })

    const sh_client_screen = (ClientListScreen) =>
        class extends ClientListScreen {
            constructor() {
                super(...arguments);
                this.customer_list = []
            }
            get clients() {
                var self = this
                var customer_list = []
                    if (this.state.query && this.state.query.trim() !== '') {
                        if (this.customer_list && this.customer_list.length > 0) {
                            return this.env.pos.db.search_visible_partner(this.state.query.trim());
                        } else {
                            return this.env.pos.db.search_partner(this.state.query.trim());
                        }
                    } else {
                        var Partners = this.env.pos.db.partner_by_id
                        var p = {}
                        _.each(Partners, function (partner) {
                            console.log("partner.is_pos_customer",partner.is_pos_customer)
                            if (partner.is_pos_customer) {
                                self.customer_list.push(1)
                                customer_list.push(partner)
                            }
                        })
                        if (customer_list.length > 0) {
                            return customer_list
                        }
                        else {
                            return []
                        }
                    }
            }
        }

    Registries.Component.extend(ClientListScreen, sh_client_screen)

});
