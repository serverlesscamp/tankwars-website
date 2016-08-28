/*global module */
module.exports = function TankwarsClientApi(apiEndpoint, ajaxProvider) {
	'use strict';
	var self = this;
	self.initiateMatch = function (options) {
		return ajaxProvider({
			method: 'POST',
			url: apiEndpoint + '/match',
			data: options
		}).then(function (response) {
			return response.body;
		}).catch(function (response) {
			throw response.body || response.status || response;
		});
	};
};
