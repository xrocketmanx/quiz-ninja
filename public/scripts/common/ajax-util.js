var ajaxUtil = (function() {
    "use strict";

    function getJSON(url, onSuccess, onError) {
        var xhr = prepareRequest(url, 'GET', onSuccess, onError);
        xhr.send();
    }

    function sendJSON(url, data, onSuccess, onError) {
        var xhr = prepareRequest(url, 'POST', onSuccess, onError);

        xhr.setRequestHeader('Content-Type', 'application/json');
        var body = JSON.stringify(data);
        xhr.send(body);
    }

    function prepareRequest(url, method, onSuccess, onError) {
        if (onError === undefined) {
            onError = function(error) {
                throw error;
            };
        }

        //ie8 cache hack
        url = appendParams(url, {uniq_param: Date.now()});

        var xhr = new XMLHttpRequest();
        try {
            xhr.open(method, url, true);
        } catch(error) {
            onError(error);
        }

        xhr.timeout = 5000;
        xhr.ontimeout = function (e) {
            onError(new Error("server not responding"));
        };

        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                try {
                    var json = JSON.parse(xhr.responseText);
                } catch (error) {
                    onError(error);
                }

                onSuccess(json);
            } else {
                onError({
                    code: xhr.status,
                    message: xhr.statusText
                });
            }
        };

        return xhr;
    }

    function appendParams(url, params) {
        url = appendSuffix(url);

        var temp = [];
        for (var key in params) {
            temp.push(key + '=' + params[key]);
        }

        return url + temp.join('&');
    }

    function appendSuffix(url) {
        var index = url.indexOf('?');
        var suffix = '';
        if (index < 0) {
            suffix = '?';
        } else if (index !== url.length - 1) {
            suffix = '&';
        }
        return url + suffix;
    }

    return {
        getJSON: getJSON,
        sendJSON: sendJSON,
        appendParams: appendParams
    };
})();
