/*global module, require,Promise*/

var TankWarsModel = require('./tankwars-model'),
	mapWidget = require('./tankwars-map-widget'),
	tankStatusWidget = require('./update-tank-statuses'),
	localStorageCacheWidget = require('./local-storage-cache-widget'),
	skipTurnsWidget = require('./skip-turns-widget'),
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
		showWinner = function (winner) {
			var outcome = findElement('outcome'), winnerLabel;
			matchContainer.classList.add('results');
			if (winner !== false) { // can be 0
				winnerLabel = 'tank' + (model.getWinner() + 1);
				outcome.innerHTML = 'Winner: ' + findElement(winnerLabel + 'Name').innerHTML;
				outcome.setAttribute('class', winnerLabel + 'avatar');
			} else {
				outcome.innerHTML = 'DRAW!';
				outcome.setAttribute('class', '');
			}
		},
		newMatch = function () {
			model.newMatch(packOptions(document));
		},
		switchPlaces = function () {
			var v = tank1Api.value;
			tank1Api.value = tank2Api.value;
			tank2Api.value = v;
		},
		hideResults = function () {
			matchContainer.classList.remove('results');
			matchContainer.classList.remove('active');
		},
		startAgain = function () {
			hideResults();
			switchPlaces();
			newMatch();
		},
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

	model.on('over', showWinner);
	tankStatusWidget(document.querySelectorAll('[role=tankStatus]'), model);
	mapWidget(findElement('matchMap'), scaleMultiplier, model);

	model.on('newMatch', function (map) {
		findElement('matchId').innerHTML = map.matchId;
		matchContainer.classList.add('active');
		findElement('suddenDeathTurns').innerHTML = map.suddenDeath;
		log.clearLog();
		getInfo(tank1Api.value, 'tank1Name');
		getInfo(tank2Api.value, 'tank2Name');
		runCommand();
	});
	model.on('change', function (map) {
		findElement('suddenDeathTurns').innerHTML = map.suddenDeath;
	});

	initMatch.addEventListener('click', newMatch);
	findElement('startAgain').addEventListener('click', startAgain);
	skipTurnsWidget(findElement('skipTurns'), model);
	findElement('hideResults').addEventListener('click', hideResults);
	findElement('toggleAdvancedOptions').addEventListener('click', function () {
		findElement('advancedOptions').classList.toggle('hide');
	});
	findElement('showLog').addEventListener('click', function () {
		findElement('logModal').classList.remove('hide');
	});
	findElement('closeLog').addEventListener('click', function () {
		findElement('logModal').classList.add('hide');
	});
};
