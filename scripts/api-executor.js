/*global module, require, Promise */
var promisingXhr = require('./promising-xhr');
module.exports = function ApiExecutor(model, appendLog) {
	'use strict';
	var self = this;
	self.timeout = 2000;
	self.info = function (url) {
		return promisingXhr({
			url: url + '/info',
			method: 'GET'
		}).then(function (response) {
			return response.body;
		});
	};
	self.execute = function (tankIndex, url) {
		var toSend = model.getVisibleMapForTank(tankIndex),
			tankLabel = (tankIndex + 1);
		if (!model.alive(tankIndex)) {
			return Promise.resolve();
		}
		appendLog('SENDING TO TANK ' + tankLabel + '\n' + JSON.stringify(toSend, null, 2));
		return promisingXhr({
			url: url + '/command',
			method: 'POST',
			data: toSend,
			timeout: self.timeout
		}).then(function (response) {
			if (response && response.body && response.body.command) {
				appendLog('RECEIVED FROM TANK: ' + tankLabel + '\n' + JSON.stringify(response.body, null, 2));
				model.executeCommand(tankIndex, response.body.command);
			} else {
				throw 'invalid response\n' + response.body;
			}
		}).catch(function (err) {
			appendLog('ERROR FROM TANK ' + tankLabel + '\n' + (err && (err.stack || err.message || JSON.stringify(err))));
			model.executeCommand(tankIndex, 'pass');
		});
	};
};
