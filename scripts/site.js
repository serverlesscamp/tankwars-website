/*global TW, window, config, document */
var initUi = function () {
	'use strict';
	var twApi = new TW.Api(config.apiEndpoint, TW.xhrAjaxProvider),
		initMatch = document.querySelector('[role=initMatch]'),
		log = document.querySelector('[role=log]');
	if (initMatch) {
		initMatch.addEventListener('click', function () {
			twApi.initiateMatch({mapSize: 100, walls: 4, maxWallLength: 10}).then(function (result) {
				log.value = JSON.stringify(result.map);
			}).catch(function (err) {
				log.value = 'Error' + JSON.stringify(err);
			});
		});
	}
};
window.addEventListener('load', initUi);
