/*global module, require, localStorage, Promise*/

var TankWarsModel = require('./tankwars-model'),
	mapWidget = require('./tankwars-map-widget'),
	updateTankStatuses = require('./update-tank-statuses'),
	promisingXhr = require('./promising-xhr'),
	packOptions = require('./pack-options'),
	uuid = require('uuid'),
	promiseDelay = require('./promise-delay');

module.exports = function initMatchPage(document) {
	'use strict';
	var scaleMultiplier = 30,
		findElement = function (role) {
			return document.querySelector('[role=' + role + ']');
		},
		matchContainer = findElement('matchContainer'),
		matchMap = mapWidget(findElement('matchMap'), scaleMultiplier),
		initMatch = findElement('initMatch'),
		status = findElement('status'),
		log = findElement('log'),
		model = new TankWarsModel(),
		appendLog = function (string) {
			log.value = log.value + '\n------\n' + string + '\n';
		},
		clearLog = function () {
			log.value = '';
		},
		matchId,
		sendAndExecute = function (tank, url) {
			var toSend = model.getVisibleMapForTank(tank);
			if (!model.alive(tank)) {
				return Promise.resolve();
			}
			toSend.matchId = matchId;

			appendLog('sending to tank ' + (tank + 1) + '\n' + JSON.stringify(toSend, null, 2));
			return promisingXhr({
				url: url + '/command',
				method: 'POST',
				data: toSend
			}).then(function (response) {
				if (response && response.body && response.body.command) {
					appendLog('RECEIVED FROM TANK: ' + (tank + 1) + '\n' + JSON.stringify(response.body, null, 2));
					model.executeCommand(tank, response.body.command);
				} else {
					throw 'invalid response\n' + response.body;
				}
			}).catch(function (err) {
				appendLog('ERROR FROM TANK ' + (tank + 1) + '\n' + (err && (err.stack || err.message || JSON.stringify(err))));
			});

		},
		tank1Api = findElement('tank1Api'),
		tank2Api = findElement('tank2Api'),
		runCommand = function () {
			Promise.all([
				sendAndExecute(0, tank1Api.value),
				sendAndExecute(1, tank2Api.value),
				promiseDelay(1)
			]).then(function () {
				if (!model.isOver()) {
					runCommand();
				}
			});
		};


	model.on('initializing', function () {
		status.innerHTML = 'Please wait... initializing';
	});
	model.on('error', function (err) {
		status.innerHTML = 'Error';
		log.value = log.value + '\n' + 'ERROR:' + JSON.stringify(err);
	});

	model.on('newMatch', function (map) {
		matchId = uuid.v4();
		matchMap.updateMap(map);
		matchContainer.classList.add('active');
		updateTankStatuses(map, document);
		clearLog();
		runCommand();
	});
	model.on('change', function (map) {
		matchMap.updateMap(map);
		updateTankStatuses(map, document);
	});
	initMatch.addEventListener('click', function () {
		model.newMatch(packOptions(document));
	});
	matchMap.addEventListener('click', function (e) {
		var x, y;
		if (e.target === this) {
			x = Math.floor(e.offsetX / scaleMultiplier);
			y = Math.floor(e.offsetY / scaleMultiplier);
			model.addWall(x, y);
		} else if (e.target.tagName === 'WALL') {
			model.removeWall(parseInt(e.target.getAttribute('x')), parseInt(e.target.getAttribute('y')));
		}
	});
	tank1Api.addEventListener('change', function () {
		localStorage.api1Url = this.value;
	});
	if (localStorage.api1Url) {
		tank1Api.value = localStorage.api1Url;
	}

	tank2Api.addEventListener('change', function () {
		localStorage.api2Url = this.value;
	});
	if (localStorage.api2Url) {
		tank2Api.value = localStorage.api2Url;
	}
};

