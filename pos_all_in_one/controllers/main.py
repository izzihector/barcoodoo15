# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo.http import request
from odoo.addons.bus.controllers.main import BusController


class SyncProductBusController(BusController):

	def _poll(self, dbname, channels, last, options):
		"""Add the relevant channels to the BusController polling."""
		channels = list(channels)
		if options.get('pos.sync.product'):
			channels.append((request.db, 'pos.sync.product', options.get('pos.sync.product')))
		
		return super(SyncProductBusController, self)._poll(dbname, channels, last, options)