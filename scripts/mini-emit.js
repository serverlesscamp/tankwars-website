/*global module */
module.exports = function makeEmitter(target) {
	'use strict';
	var listeners = {};
	target.on = function (event, handler) {
		if (!listeners[event]) {
			listeners[event] = [];
		}
		listeners[event].push(handler);
	};
	target.emit = function (event) {
		var eventListeners = listeners[event],
			args = Array.prototype.slice.apply(arguments, [1]);
		if (eventListeners) {
			eventListeners.forEach(function (listener) {
				listener.apply(null, args);
			});
		}
	};
	return target;
};

