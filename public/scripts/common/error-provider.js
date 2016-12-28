(function(global, ajax) {
    "use strict";

    global.onerror = function() {
        var error = makeError.apply(null, arguments);
        ajax.sendJSON('/log/error', error, function() {}, function(err) {
            console.error(err.message);
        });
    };

    function makeError(msg, url, line, col, errObj) {
        if (errObj) {
            return {
                message: errObj.message,
                stack: errObj.stack
            }
        } else {
            var message = msg;
            var stack = '\n(' + url + ':' + line;
            stack += col ? ':' + col + ')' : ')';

            return {
                message: message,
                stack: stack
            };
        }
    }
})(window, ajaxUtil);
