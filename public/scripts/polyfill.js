/*Polyfills for mostly used function*/
(function() {
    //Functions
    if(!Function.prototype.bind) {
        Function.prototype.bind = function(thisArg) {
            var func = this;
            var args = Array.prototype.slice.call(arguments, 1);
            return function() {
                args = args.concat(Array.prototype.slice.call(arguments));
                return func.apply(thisArg, args);
            };
        };
    }
    //Objects
    if (!Object.create) {
        Object.create = function(proto) {
            var F = new Function();
            F.prototype = proto;
            return new F;
        };
    }
    //Arrays
    if(!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            fromIndex = fromIndex || 0;
            for (var i = fromIndex; i < this.length; i++) {
                if (searchElement === this[i]) {
                    return i;
                }
            }
            return -1;
        };
    }
    if(!Array.prototype.forEach) {
        Array.prototype.forEach = function(func) {
            for (var i = 0; i < this.length; i++) {
                func(this[i], i, this);
            }
        };
    }
    if(!Array.prototype.map) {
        Array.prototype.map = function(func) {
            var result = [];
            for (var i = 0; i < this.length; i++) {
                result.push(func(this[i], i, this));
            }
            return result;
        };
    }
    if(!Array.prototype.reduce) {
        Array.prototype.reduce = function(func, initial) {
            initial = initial || 0;
            for (var i = 0; i < this.length; i++) {
                initial = func(initial, this[i], i, this);
            }
            return initial;
        };
    }
    if(!Array.prototype.filter) {
        Array.prototype.filter = function(func) {
            var result = [];
            for (var i = 0; i < this.length; i++) {
                if (func(this[i])) result.push(this[i]);
            }
            return result;
        };
    }
    //EventTarget
    if (!window.addEventListener) {
        Element.prototype.addEventListener = function(type, handler) {
            this.attachEvent('on' + type, handler.bind(this));
        };
    }
    if (!window.removeEventListener) {
        Element.prototype.removeEventListener = function(type, handler) {
            this.detachEvent('on' + type, handler);
        };
    }
    //DOM Elements
    if (!("classList" in document.createElement("_"))) {
        Object.defineProperty(Element.prototype, 'classList', {
            configurable: true,
            enumerable: false,
            get: function() {
                return new ClassList(this);
            }
        });

        function ClassList(element) {
            this.add = function() {
                var tokens = getTokens();
                for (var i = 0; i < arguments.length; i++) {
                    tokens.push(arguments[i]);
                }
                updateClassName(tokens);
            };

            this.remove = function() {
                var tokens = getTokens();
                var args = Array.prototype.slice.call(arguments);
                var updated = [];
                for (var i = 0; i < tokens.length; i++) {
                    if (args.indexOf(tokens[i]) < 0) {
                        updated.push(tokens[i]);
                    }
                }
                updateClassName(updated);
            };

            this.contains = function(token) {
                var tokens = getTokens();
                return tokens.indexOf(token) >= 0;
            };

            function getTokens() {
                return element.className ? element.className.split(' ') : [];
            }

            function updateClassName(tokens) {
                element.setAttribute('class', tokens.join(' '));
            }
        }
    }
})();