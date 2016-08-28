/*global module, require */

var promisingXhr = require('./promising-xhr'),
	TankWarsClientApi = require('./tankwars-client-api'),
	TankWarsModel = require('./tankwars-model'),
	mapWidget = require('./tankwars-map-widget');

module.exports = function initMatchPage(document, config) {
	'use strict';
	var api = new TankWarsClientApi(config.apiEndpoint, promisingXhr),
		twModel = new TankWarsModel(api),
		findElement = function (role) {
			return document.querySelector('[role=' + role + ']');
		},
		initMatch = findElement('initMatch'),
		log = findElement('log'),
		matchId = findElement('matchId'),
		status = findElement('status'),
		matchContainer = findElement('matchContainer'),
		matchMap = mapWidget(findElement('matchMap'), 5);


	initMatch.addEventListener('click', twModel.initiateMatch);
	twModel.on('initializing', function () {
		status.innerHTML = 'Please wait... initializing';
	});
	twModel.on('error', function (err) {
		status.innerHTML = 'Error';
		log.value = log.value + '\n' + 'ERROR:' + JSON.stringify(err);
	});
	twModel.on('newMatch', function (id, map) {
		matchContainer.classList.add('active');
		status.innerHTML = 'Match initialized';
		matchId.innerHTML = id;
		log.value = log.value + '\n' + JSON.stringify(map);
		matchMap.updateMap(map);
	});
};

