/*global module, require */

var TankWarsModel = require('./tankwars-model'),
	mapWidget = require('./tankwars-map-widget'),
	tankStatusWidget = require('./update-tank-statuses'),
	skipTurnsWidget = require('./skip-turns-widget'),
	localStorageCacheWidget = require('./local-storage-cache-widget'),
	logWidget = require('./log-widget'),
	ApiExecutor = require('./api-executor'),
	packOptions = require('./pack-options');

module.exports = function initMatchPage(document) {
	'use strict';
	var scaleMultiplier = 30,
		findElement = function (role) {
			return document.querySelector('[role=' + role + ']');
		},
		commandSelector = findElement('command'),
		manualTankSelector = findElement('tankManual'),
		apiTankSelector = findElement('tankApi'),
		updateCommandOptions = function (commands) {
			commandSelector.innerHTML = commands.map(function (command) {
				return '<option>' + command + '</option>';
			}).join(' ');
		},
		updateTankList = function (tanks) {
			manualTankSelector.innerHTML = tanks.map(function (tank, index) {
				return '<option value="' + index + '"> Tank ' + index + '</option>';
			}).join(' ');
			apiTankSelector.innerHTML = tanks.map(function (tank, index) {
				return '<option value="' + index + '"> Tank ' + index + '</option>';
			}).join(' ');
		},
		randomMap = findElement('randomMap'),
		matchContainer = findElement('matchContainer'),
		model = new TankWarsModel(),
		matchMap = mapWidget(findElement('matchMap'), scaleMultiplier, model),
		apiUrl = localStorageCacheWidget(findElement('apiUrl'), 'apiUrl'),
		log = logWidget(findElement('log')),
		apiExecutor = new ApiExecutor(model, log.appendLog);

	tankStatusWidget(document.querySelectorAll('[role=tankStatus]'), model);
	model.on('newMatch', function (map) {
		updateCommandOptions(model.getSupportedCommands());
		findElement('matchId').innerHTML = map.matchId;
		updateTankList(map.tanks);
		matchContainer.classList.add('active');
		findElement('suddenDeathTurns').innerHTML = map.suddenDeath;
		log.clearLog();
	});
	model.on('change', function (map) {
		findElement('suddenDeathTurns').innerHTML = map.suddenDeath;
	});
	randomMap.addEventListener('click', function () {
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
	skipTurnsWidget(findElement('skipTurns'), model);
	findElement('execute').addEventListener('click', function () {
		var tankId = parseInt(manualTankSelector.value);
		log.appendLog('Manually sending ' + commandSelector.value + ' to tank ' + tankId);
		model.executeCommand(tankId, commandSelector.value);
	});
	findElement('executeApi').addEventListener('click', function () {
		var tankId = parseInt(apiTankSelector.value);
		apiExecutor.execute(tankId, apiUrl.value);
	});
	findElement('toggleAdvancedOptions').addEventListener('click', function () {
		findElement('advancedOptions').classList.toggle('hide');
	});
	findElement('showLog').addEventListener('click', function () {
		findElement('logModal').classList.remove('hide');
	});
	findElement('closeLog').addEventListener('click', function () {
		findElement('logModal').classList.add('hide');
	});
	model.newMatch(packOptions(document));
};
