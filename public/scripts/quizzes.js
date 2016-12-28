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

var Paginator = (function(){
    "use strict";

    function Paginator(items, itemsPageCount) {
        var length = items.length;
        var page = 1;
        var pagesCount = Math.ceil(length / itemsPageCount);

        this.getPagesCount = function() {
            return pagesCount;
        };

        this.getItems = function() {
            var offset = (page - 1) * itemsPageCount;
            return items.slice(offset, offset + itemsPageCount);
        };

        this.getPagination = function(onClick) {
            var pagination = renderPagination();

            pagination.addEventListener('click', function(event) {
                event = event || window.event;

                var anchor = event.target || event.srcElement;
                if (anchor.tagName === 'A') {
                    if (event.preventDefault) {
                        event.preventDefault();
                    } else {
                        event.returnValue = false;
                    }
                    page = +anchor.getAttribute('href').slice(1);
                    onClick();
                }
            });

            return pagination;
        };

        function renderPagination() {
            var pagination = document.createElement('ol');
            pagination.className = 'pagination';
            if (pagesCount <= 1) return pagination;

            appendLink(pagination, '«', 1);

            var first = page - 2 > 0 ? page - 2 : 1;
            var last = page + 2 <= pagesCount ? page + 2 : pagesCount;

            for (var i = first; i < page; i++) {
                appendLink(pagination, i);
            }
            appendLink(pagination, page, page, 'active');
            for (i = page + 1; i <= last; i++) {
                appendLink(pagination, i);
            }

            appendLink(pagination, '»', pagesCount);
            return pagination;
        }

        function appendLink(pagination, text, href, className) {
            href = href || text;

            var li = document.createElement('li');
            var link = document.createElement('a');
            link.appendChild(document.createTextNode(text));
            if (className) {
                link.className = className;
            }
            link.setAttribute('href', '#' + href);
            li.appendChild(link);
            pagination.appendChild(li);
        }
    }

    return Paginator;
})();

function ErrorNotifier(container, timeout) {
    "use strict";

    var messageElement = container.querySelector('message');
    if (!messageElement) {
        messageElement = document.createElement('strong');
        messageElement.classList.add('message');
        container.appendChild(messageElement);
    }

    this.show = function(errorMessage) {
        container.style.display = 'block';
        messageElement.innerHTML = 'Error: ' + errorMessage;
        setTimeout(hide, timeout);
    };

    function hide() {
        container.style.display = 'none';
    }
}

ErrorNotifier.LOADING_ERROR = 'Failed to load';

(function() {
    "use strict";

    var quizzesContainer = document.querySelector('.quizzes-list');
    var paginationContainer = document.querySelector('.pagination-container');
    var errorPopup = document.querySelector('.error-popup');

    var errorNotifier = new ErrorNotifier(errorPopup, 10000);
    var quizzesController = new QuizzesController(
        new QuizzesDb(ajaxUtil, errorNotifier),
        new QuizzesView(quizzesContainer, paginationContainer),
        new ViewOptions(document.forms['view-options']));

    quizzesController.init();

    function QuizzesController(quizzesDB, quizzesView, viewOptions) {
        var ITEMS_PER_PAGE = 10;

        this.renderQuizzes = function(options) {
            var quizzes = quizzesDB.getQuizzes(options);
            var paginator = new Paginator(quizzes, ITEMS_PER_PAGE);

            var pagination = paginator.getPagination(function onClick() {
                quizzesView.refreshPagination(paginator.getPagination(onClick));
                quizzesView.renderQuizzes(paginator.getItems())
            });

            quizzesView.refreshPagination(pagination);
            quizzesView.renderQuizzes(paginator.getItems());
        };

        this.init = function() {
            var self = this;
            quizzesDB.load(function() {
                self.renderQuizzes(viewOptions.getViewOptions());
                viewOptions.onChange(function(options) {
                    self.renderQuizzes(options);
                });
            });
        };
    }

    /**
     * Receives and process data
     * @param ajax utility for ajax queries
     * @param errorNotifier notify user about errors
     * @constructor
     */
    function QuizzesDb(ajax, errorNotifier) {
        var QUIZZES_PATH = '/quizzes';
        var quizzes = [];

        this.load = function(callback) {
            ajax.getJSON(QUIZZES_PATH, function(result) {
                quizzes = result;
                callback();
            }, function(error) {
                errorNotifier.show(ErrorNotifier.LOADING_ERROR + ' quizzes');
                throw error;
            });
        };

        this.getQuizzes = function(options) {
            var result = quizzes.slice();

            if (options.filter) {
                result = result.filter(function(quiz) {
                    return filterCompare(quiz[options.filter.field],
                        options.filter.value, options.filter.relation);
                });
            }

            if (options.sort) {
                result = result.sort(function(a, b) {
                    var temp = compare(a[options.sort.field], b[options.sort.field]);
                    if (options.sort.order === 'asc') {
                        return temp;
                    } else if (options.sort.order === 'desc') {
                        return -temp;
                    }
                });
            }

            return result;
        };

        var filterComparators = {
            'is': function(a, b) {
                return a === b;
            },
            'has': function(a, b) {
                return a.indexOf(b) >= 0;
            },
            '>': function(a, b) {
                return a > b;
            },
            '<': function(a, b) {
                return a < b;
            },
            '>=': function(a, b) {
                return a >= b;
            },
            '<=': function(a, b) {
                return a <= b;
            }
        };
        function filterCompare(a, b, relation) {
            if (typeof a === 'string') a = a.toLowerCase().replace(/\s/g, '');
            if (typeof b === 'string') b = b.toLowerCase().replace(/\s/g, '');
            return filterComparators[relation](a, b);
        }

        function compare(a, b) {
            if (typeof a === 'string' && typeof b === 'string') {
                return a.localeCompare(b);
            }

            if (a > b) return 1;
            else if (a < b) return -1;
            return 0;
        }
    }

    /**
     * Renders Quizzes to container
     * @param container
     * @param paginationContainer
     * @constructor
     */
    function QuizzesView(container, paginationContainer) {
        var CLASS_NAMES = {
            quizElement: 'quiz col-5 col-s-12',
            quizHeader: 'quiz-header row',
            likes: 'like link',
            description: 'quiz-description',
            btn: 'btn-primary'
        };

        this.renderQuizzes = function(quizzes) {
            container.innerHTML = '';

            for (var i = 0; i < quizzes.length; i++) {
                var renderedQuiz = renderQuiz(quizzes[i]);
                if (i % 2 === 0) {
                    renderedQuiz.classList.add('push-r-2');
                    renderedQuiz.classList.add('clear');
                }
                container.appendChild(renderedQuiz);
            }
        };

        this.refreshPagination = function(pagination) {
            paginationContainer.innerHTML = '';
            paginationContainer.appendChild(pagination);
        };

        function renderQuiz(quiz) {
            var quizElement = document.createElement('article');
            quizElement.className = CLASS_NAMES.quizElement;

            var header = createHeader(quiz.name, quiz.likes);

            var description = createDescription(quiz.description);

            var btn = createButton('to quiz', quiz.id);

            quizElement.appendChild(header);
            quizElement.appendChild(description);
            quizElement.appendChild(btn);
            return quizElement;
        }

        function createHeader(name, likes) {
            var header = document.createElement('header');
            header.className = CLASS_NAMES.quizHeader;

            var nameElement = document.createElement('h2');
            nameElement.appendChild(document.createTextNode(name));

            var likesElement = document.createElement('a');
            likesElement.className = CLASS_NAMES.likes;
            likesElement.setAttribute('href', '#');
            likesElement.appendChild(document.createTextNode(likes));

            header.appendChild(nameElement);
            header.appendChild(likesElement);

            return header;
        }

        function createDescription(description) {
            var descriptionElement = document.createElement('p');
            descriptionElement.appendChild(document.createTextNode(description));
            descriptionElement.className = CLASS_NAMES.descriptionElement;
            return descriptionElement;
        }

        function createButton(text, id) {
            var btn = document.createElement('a');
            btn.appendChild(document.createTextNode(text));
            btn.setAttribute('href', 'quiz?id=' + id);
            btn.className = CLASS_NAMES.btn;
            return btn;
        }
    }

    /**
     * Gets user sort and filter options
     * @constructor
     */
    function ViewOptions(form) {
        var nameFilter = form['name'];
        var sortField = form['sort-field'];
        var orderDirection = form['order'];

        this.onChange = function(callback) {
            var self = this;
            nameFilter.addEventListener('keyup', function() {
                callback(self.getViewOptions());
            });

            sortField.addEventListener('change', function() {
                callback(self.getViewOptions());
            });

            //ie8 onchange hack
            document.querySelector('[for=order]').addEventListener('click', function() {
                setTimeout(function() {
                    callback(self.getViewOptions());
                }, 0);
            });
        };

        this.getViewOptions = function() {
            return {
                sort: {
                    field: sortField.value,
                    order: orderDirection.checked ? 'desc' : 'asc'
                },
                filter: {
                    field: 'name',
                    relation: 'has',
                    value: nameFilter.value
                }
            };
        };
    }
})();
