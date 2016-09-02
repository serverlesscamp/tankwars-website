/*global XMLHttpRequest, Promise, module */
module.exports = function promisingXhr(options) {
	'use strict';
	var xhr = new XMLHttpRequest(),
	method = options.method || 'GET',
	postData = (typeof options.data === 'object') ? JSON.stringify(options.data) : options.data;
	return new Promise(function (resolve, reject) {
		xhr.open(method, options.url, true);
		xhr.responseType = 'json';
		xhr.timeout = options.timeout || 0;
		if (postData) {
			xhr.setRequestHeader('Content-type', 'application/json');
		}
		xhr.addEventListener('load', function () {
			if (xhr.status >= 200 && xhr.status < 399) {
				resolve({
					status: xhr.status,
					body: xhr.response
				});
			} else {
				reject({
					status: xhr.status,
					body: xhr.response
				});
			}
		});
		xhr.addEventListener('error', function () {
			reject({
				status: xhr.status,
				body: xhr.response
			});
		});
		xhr.addEventListener('timeout', function () {
			reject('timeout');
		});
		xhr.send(postData);
	});
};

