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
        xhr.open(method, url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            if (xhr.status != 200) {
                onError({
                    code: xhr.status,
                    message: xhr.statusText
                });
            } else {
                onSuccess(JSON.parse(xhr.responseText));
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
