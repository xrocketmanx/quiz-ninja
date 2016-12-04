var check = (function () {
    var checkers = {
        'number': function(value) {
            return !isNaN(parseFloat(value)) && isFinite(value);
        },
        'array': function(value) {
            return Array.isArray(value);
        },
        'object': function(value) {
            return typeof value === 'object' && !Array.isArray(value);
        }
    };
    
    return function(name, value, type) {
        if (value === null) {
            throw new TypeError(name + ' is null');
        } else if (value === undefined) {
            throw new TypeError(name + ' is undefined');
        }

        var valid = false;
        if (checkers[type]) {
            valid = checkers[type](value);
        } else {
            valid = typeof value === type;
        }

        if (!valid) {
            throw new TypeError(name + ' is not ' + type);
        }
    };
})();
