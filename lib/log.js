module.exports = (function() {
    "use strict";

    var _ = require('underscore');
    var util = require('util');

    var AutomapperLogger = function() {
        var _isEnabled = false,
            _log = function(msg) {
                console.log(msg);
            };

        this.isEnabled = function() {
            if (arguments.length > 0 && _.isBoolean(arguments[0])) {
                _isEnabled = arguments[0];
                return;
            }
            return _isEnabled;
        };

        this.log = function(msg) {
            if (_isEnabled && _.isFunction(_log) && arguments.length > 1) {
                _log(util.format.apply(null, arguments));
            } else if (_isEnabled && _.isFunction(_log)) {
                _log(msg);
            }
        };

        this.getLog = function() {
            return _log;
        };

        this.setLog = function(func) {
            _log = func;
        };
    };
    AutomapperLogger.prototype = {};

    return AutomapperLogger;
})();