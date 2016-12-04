var ajaxUtil = (function() {
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
        //ie8 cache hack
        url = appendParams(url, {uniq_param: Date.now()});

        var xhr = new XMLHttpRequest();
        try {
            xhr.open(method, url, true);
        } catch(error) {
            onError(error);
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                onSuccess(JSON.parse(xhr.responseText));
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
        if (typeof params !== 'object' || params === null) {
            throw new TypeError('appendParams(): params is not object');
        }

        url = appendSuffix(url);

        var temp = [];
        for (var key in params) {
            temp.push(key + '=' + params[key]);
        }

        return url + temp.join('&');
    }

    function appendSuffix(url) {
        if (typeof url !== 'string') {
            throw new TypeError('appendParams(): url is not string');
        }

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
