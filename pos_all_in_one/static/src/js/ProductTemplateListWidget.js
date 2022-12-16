odoo.define('pos_all_in_one.ProductTempProduct', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');

    class ProductProduct extends PosComponent {
        /**
         * For accessibility, pressing <space> should be like clicking the product.
         * <enter> is not considered because it conflicts with the barcode.
         *
         * @param {KeyPressEvent} event
         */

        constructor() {
            super(...arguments);
            useListener('click-product-template', this.add_product);
        }

        add_product(){
            // this.env.pos.get_order().add_product(this.props.product);
            // this.trigger('close-popup');    
            var self = this
            let product = this.props.product        
            let allow_order = this.env.pos.config.pos_allow_order;
            let deny_order= this.env.pos.config.pos_deny_order;
            let call_super = true;
            if(this.env.pos.config.pos_display_stock)
            {
                if(this.env.pos.config.show_stock_location == 'specific' && product.type == 'product')
                {
                    var partner_id = this.env.pos.get_client();
                    var location = this.env.pos.locations;
                    this.rpc({
                        model: 'stock.quant',
                        method: 'get_single_product',
                        args: [partner_id ? partner_id.id : 0,product.id, location],
                    }).then(function(output) {
                        if (allow_order == false)
                        {
                            if ( (output[0][1] <= deny_order) || (output[0][1] <= 0) )
                            {
                                call_super = false;
                                self.showPopup('ErrorPopup', {
                                    title: self.env._t('Deny Order'),
                                    body: self.env._t("Deny Order" + "(" + product.display_name + ")" + " is Out of Stock."),
                                });
                            }
                        }
                        else if(allow_order == true)
                        {
                            if (output[0][1] <= deny_order)
                            {
                                call_super = false;
                                self.showPopup('ErrorPopup', {
                                    title: self.env._t('Deny Order'),
                                    body: self.env._t("Deny Order" + "(" + product.display_name + ")" + " is Out of Stock."),
                                });
                            }
                        }
                    });
                }
                else{
                    if (product.type == 'product' && allow_order == false)
                    {
                        if (product.qty_available <= deny_order && allow_order == false)
                        {
                            call_super = false; 
                            self.showPopup('ErrorPopup', {
                                title: self.env._t('Deny Order'),
                                body: self.env._t("Deny Order" + "(" + product.display_name + ")" + " is Out of Stock."),
                            });
                        }
                        else if (product.qty_available <= 0 && allow_order == false)
                        {
                            call_super = false; 
                            self.showPopup('ErrorPopup', {
                                title: self.env._t('Error: Out of Stock'),
                                body: self.env._t("(" + product.display_name + ")" + " is Out of Stock."),
                            });
                        }
                    }
                    else if(product.type == 'product' && allow_order == true && product.qty_available <= deny_order){
                        call_super = false; 
                        self.showPopup('ErrorPopup', {
                            title: self.env._t('Error: Out of Stock'),
                            body: self.env._t("(" + product.display_name + ")" + " is Out of Stock."),
                        });
                    }
                }
            }
            if(call_super){
                // super._clickProduct(event);
                this.env.pos.get_order().add_product(this.props.product);
                this.trigger('close-popup');  
            }
        }
        get imageUrl() {
            const product = this.props.product;

            return `/web/image?model=product.product&field=image_128&id=${product.id}&write_date=${product.write_date}&unique=1`;
        }
        get pricelist() {
            const current_order = this.env.pos.get_order();
            if (current_order) {
                return current_order.pricelist;
            }
            return this.env.pos.default_pricelist;
        }
        get price() {
            const formattedUnitPrice = this.env.pos.format_currency(
                this.props.product.get_price(this.pricelist, 1),
                'Product Price'
            );
            if (this.props.product.to_weight) {
                return `${formattedUnitPrice}/${
                    this.env.pos.units_by_id[this.props.product.uom_id[0]].name
                }`;
            } else {
                return formattedUnitPrice;
            }
        }
    }
    ProductProduct.template = 'ProductProduct';

    Registries.Component.add(ProductProduct);

    return ProductProduct;
});
