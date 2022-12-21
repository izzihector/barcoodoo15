odoo.define('pos_all_in_one.ProductDetailsEdit', function(require) {'use strict';

	const { useExternalListener } = owl.hooks;
	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');
	const { useState } = owl.hooks;
	const { getDataURLFromFile } = require('web.utils');

	const rpc = require('web.rpc');
	let core = require('web.core');
	let _t = core._t;

	class ProductDetailsEdit extends AbstractAwaitablePopup {
		constructor() {
			super(...arguments);
			this.changes = {}
			this.product = arguments[1].product;
		}

		cancel() {
			this.props.resolve({ confirmed: false, payload: null });
			this.trigger('close-popup');
		}

		get imageUrl() {
            const product = this.product;
            return `/web/image?model=product.product&field=image_128&id=${product.id}&write_date=${product.write_date}&unique=1`;
        }

		captureChange(event) {
			this.changes[event.target.name] = event.target.value;
		}

		async uploadImage(event) {
			const file = event.target.files[0];
			if (!file.type.match(/image.*/)) {
				await this.showPopup('ErrorPopup', {
					title: this.env._t('Unsupported File Format'),
					body: this.env._t(
						'Only web-compatible Image formats such as .png or .jpeg are supported.'
					),
				});
			} else {
				const imageUrl = await getDataURLFromFile(file);
				const loadedImage = await this._loadImage(imageUrl);
				if (loadedImage) {
					const resizedImage = await this._resizeImage(loadedImage, 800, 600);
					this.changes.image_1920 = resizedImage.toDataURL();
					// Rerender to reflect the changes in the screen
					this.render();
				}
			}
		}
		_resizeImage(img, maxwidth, maxheight) {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			var ratio = 1;

			if (img.width > maxwidth) {
				ratio = maxwidth / img.width;
			}
			if (img.height * ratio > maxheight) {
				ratio = maxheight / img.height;
			}
			var width = Math.floor(img.width * ratio);
			var height = Math.floor(img.height * ratio);

			canvas.width = width;
			canvas.height = height;
			ctx.drawImage(img, 0, 0, width, height);
			return canvas;
		}
		/**
		 * Loading image is converted to a Promise to allow await when
		 * loading an image. It resolves to the loaded image if succesful,
		 * else, resolves to false.
		 *
		 * [Source](https://stackoverflow.com/questions/45788934/how-to-turn-this-callback-into-a-promise-using-async-await)
		 */
		_loadImage(url) {
			return new Promise((resolve) => {
				const img = new Image();
				img.addEventListener('load', () => resolve(img));
				img.addEventListener('error', () => {
					this.showPopup('ErrorPopup', {
						title: this.env._t('Loading Image Error'),
						body: this.env._t(
							'Encountered error when loading image. Please try again.'
						),
					});
					resolve(false);
				});
				img.src = url;
			});
		}


		save_product() {
			var self = this;

			var fields = {};
			$('.product-details-box .product-input').each(function(idx,el){
				fields[el.name] = el.value;
			});
			if(fields.display_name == false){
				self.showPopup('ErrorPopup',{
					'title': _t('Error: Could not Save Changes'),
					'body': _t('please enter product name.'),
				});
			}else{
				if (this.product!= false){
					fields.id = this.product.id || false;   
				}else{
					fields.id = false;
				}
				fields.image_1920 = this.changes.image_1920
				fields.pos_categ_id = fields.pos_categ_id || false;
				fields.list_price = fields.list_price || '';
				fields.standard_price = fields.standard_price || '';
				fields.barcode = fields.barcode || false;
				// fields.barcode = fields.barcode || false;
				if (fields.cost_price == '') {
					fields.cost_price = '0'
				}
				if (fields.list_price == '') {
					fields.list_price = '0'
				}

				if (fields.standard_price == '') {
					fields.standard_price = '0'
				}
				rpc.query({
					model: 'product.product',
					method: 'create_from_ui',
					args: [fields],
				})
				.then(function(product_id){
					alert('Product Details Saved!!!!');
					self.showScreen('ProductScreen');
					self.trigger('close-popup');
					self.render();
				},function(err, event){
				self.showPopup('ErrorPopup',{
					'title': _t('Error: Could not Save Changes'),
					'body': _t('Added Product Details getting Error.'),
				});
			});
			}
		}
	}
	
	ProductDetailsEdit.template = 'ProductDetailsEdit';
	ProductDetailsEdit.defaultProps = {
		confirmText: 'Create',
		cancelText: 'Close',
		title: 'Edit Product',
		body: '',
	};
	Registries.Component.add(ProductDetailsEdit);
	return ProductDetailsEdit;
});
