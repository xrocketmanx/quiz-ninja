(function() {
    "use strict";

    //INIT
    var quizzesContainer = document.querySelector('.quizzes-list');
    var paginationContainer = document.querySelector('.pagination-container');
    var quizzesController = new QuizzesController(
        new Quizzes(ajaxUtil), new QuizzesView(quizzesContainer, paginationContainer), new ViewOptions());
    quizzesController.load();

    /**
     * @param {Quizzes} quizzesDB
     * @param {QuizzesView} quizzesView
     * @param {ViewOptions} viewOptions
     * @constructor
     */
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

        this.load = function() {
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
     * @constructor
     */
    function Quizzes(ajax) {
        var quizzes = [];

        this.load = function(callback) {
            quizzes = [
                {id: 1, name: 'HTML', likes: 23, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 2, name: 'JavaScript', likes: 15, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 3, name: 'Python Basics', likes: 10, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 4, name: 'Java', likes: 5, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 5, name: 'Java Advanced', likes: 32, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 6, name: 'Python Advanced', likes: 17, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 7, name: 'C#', likes: 13, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 8, name: 'java script essentials', likes: 19, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 9, name: 'Ruby', likes: 8, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 10, name: 'PHP', likes: 5, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'},
                {id: 11, name: 'C++', likes: 17, description: 'Nice description of great quiz. This quiz is super and great. This quiz will help you to learn everything about this world.'}
            ];
            callback();
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

            var btn = createButton('Learn more...', quiz.id);

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
            btn.setAttribute('href', 'quiz.html?id=' + id);
            btn.className = CLASS_NAMES.btn;
            return btn;
        }
    }

    /**
     * Gets user sort and filter options
     * @constructor
     */
    function ViewOptions() {
        var nameFilter = document.getElementById('name-filter');
        var sortField = document.getElementById('sort-field');
        var orderDirection = document.getElementById('order');

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
