/*global module, require,Promise*/

var TankWarsModel = require('./tankwars-model'),
	mapWidget = require('./tankwars-map-widget'),
	tankStatusWidget = require('./update-tank-statuses'),
	localStorageCacheWidget = require('./local-storage-cache-widget'),
	ApiExecutor = require('./api-executor'),
	packOptions = require('./pack-options'),
	logWidget = require('./log-widget'),
	promiseDelay = require('./promise-delay');

module.exports = function initMatchPage(document) {
	'use strict';
	var scaleMultiplier = 30,
		findElement = function (role) {
			return document.querySelector('[role=' + role + ']');
		},
		matchContainer = findElement('matchContainer'),
		initMatch = findElement('initMatch'),
		log = logWidget(findElement('log')),
		model = new TankWarsModel(),
		apiExecutor = new ApiExecutor(model, log.appendLog),
		tank1Api = localStorageCacheWidget(findElement('tank1Api'), 'api1Url'),
		tank2Api = localStorageCacheWidget(findElement('tank2Api'), 'api2Url'),
		runCommand = function () {
			Promise.all([
				apiExecutor.execute(0, tank1Api.value),
				apiExecutor.execute(1, tank2Api.value),
				promiseDelay(1)
			]).then(function () {
				if (!model.isOver()) {
					runCommand();
				}
			});
		},
		getInfo = function (url, fieldRole) {
			var field = findElement(fieldRole);
			apiExecutor.info(url).then(function (info) {
				field.innerHTML = (info.name + ' <span>' + info.owner + '</span>');
			}).catch(function () {
				field.innerHTML = 'Unknown';
			});
		};

	tankStatusWidget(document.querySelectorAll('[role=tankStatus]'), model);
	mapWidget(findElement('matchMap'), scaleMultiplier, model);

	model.on('newMatch', function (map) {
		findElement('matchId').innerHTML = map.matchId;
		matchContainer.classList.add('active');
		log.clearLog();
		getInfo(tank1Api.value, 'tank1Name');
		getInfo(tank2Api.value, 'tank2Name');
		runCommand();
	});

	initMatch.addEventListener('click', function () {
		model.newMatch(packOptions(document));
	});
};

