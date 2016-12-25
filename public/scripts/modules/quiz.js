(function () {
    "use strict";

    var quizContainer = document.getElementById('quiz');
    var shareContainer = document.getElementById('share');
    var errorPopup = document.querySelector('.error-popup');

    var errorNotifier = new ErrorNotifier(errorPopup, 10000);
    var quizController = new QuizController(
        new QuizView(quizContainer),
        new ShareView(shareContainer),
        new QuizDb(ajaxUtil, errorNotifier));

    quizController.init();

    function QuizController(quizView, shareView, quizDb) {
        this.init = function() {
            quizDb.getById(quizView.getQueryParams().id, function(quiz) {
                quizView.render(quiz);

                var quizUtil = new QuizUtil({
                    questions: quiz.questions,
                    time: quiz.time,
                    onEnd: function(questions) {
                        quizDb.getAnswers(quiz.id, function(answers) {
                            quizView.showResult(quizUtil.getResultStats(questions, answers));
                            shareView.showSharing(quiz.name);
                        });
                    }
                });

                quizView.onStart(function() {
                    quizUtil.loadQuiz();
                    quizView.showForm();
                    quizUtil.startQuiz();
                });
            });
        };
    }

    function QuizDb(ajax, errorNotifier) {
        var QUIZZES_PATH = '/quizzes/';
        var ANSWERS_PATH = '/answers';

        this.getById = function(id, callback) {
            ajax.getJSON(QUIZZES_PATH + id, function(quiz) {
                callback(quiz);
            }, function(error) {
                errorNotifier.show(ErrorNotifier.LOADING_ERROR + ' questions');
                throw error;
            });
        };

        this.getAnswers = function(id, callback) {
            ajax.getJSON(QUIZZES_PATH + id + ANSWERS_PATH, function(answers) {
                callback(answers);
            }, function(error) {
                errorNotifier.show(ErrorNotifier.LOADING_ERROR + ' answers');
                throw error;
            });
        };
    }

    function QuizView(container) {
        var PROGRESS_COLORS = ['rgb(217,83,79)', 'rgb(224,201,0)', 'rgb(92,184,92)'];
        var startBtn = container.querySelector('#start');
        var quizForm = container.querySelector('.qu-form');

        this.render = function(quiz) {
            this.hideForm();
            document.querySelector('.breadcrumb .active').innerHTML = quiz.name;
        };

        this.hideForm = function() {
            quizForm.style.display = 'none';
        };

        this.showForm = function() {
            quizForm.style.display = 'block';
        };

        this.getQueryParams = function() {
            var params = window.location.search.slice(1).split('&');
            return params.reduce(function(obj, param) {
                var pair = param.split('=');
                obj[pair[0]] = pair[1];
                return obj;
            }, {});
        };

        this.showResult = function(stats) {
            quizForm.innerHTML = '';

            var length = stats.questionElements.length;
            var message = 'Result: '
                + stats.answeredCorrect + ' of ' + length;

            var result = renderResultMessage(message);
            quizForm.appendChild(result);

            var progressElement = ProgressBar.render();
            quizForm.appendChild(progressElement);
            var progressBar = new ProgressBar(progressElement);
            progressBar.show(stats.answeredCorrect * 100 / length, 1000, PROGRESS_COLORS);

            for (var i = 0; i < stats.questionElements.length; i++) {
                quizForm.appendChild(stats.questionElements[i]);
            }
        };

        this.onStart = function(callback) {
            startBtn.addEventListener('click', function() {
                startBtn.style.display = 'none';
                callback.apply(this, arguments);
            });
        };

        function renderResultMessage(message) {
            var result = document.createElement('p');
            result.className = 'quiz-result';
            result.appendChild(document.createTextNode(message));
            return result;
        }
    }
    
    function ShareView(container) {
        container.style.display = 'none';

        this.showSharing = function(description) {
            container.style.display = 'block';
            renderShareButtons({
                url: location.href,
                desc: description,
                title: document.title
            });
        };

        function renderShareButtons(options) {
            var buttons = container.querySelectorAll('.share-btn');
            for (var i = 0; i < buttons.length; i++) {
                var href = buttons[i].getAttribute('href');

                buttons[i].setAttribute('href', renderHref(href, options));
                buttons[i].addEventListener('click', popup);
            }
        }

        function renderHref(href, options) {
            for (var key in options) {
                href = href.replace('{' + key + '}', encodeURIComponent(options[key]));
            }
            return href;
        }
        
        function popup(event) {
            event = event || window.event;
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }

            window.open(this.href, '', parseWindowOptions({
                menubar: 'no',
                toolbar: 'no',
                resizable: 'yes',
                scrollbars: 'yes',
                height: 400,
                width: 400
            }));
        }

        function parseWindowOptions(options) {
            var pairs = [];
            for (var key in options) {
                pairs.push(key+'='+options[key]);
            }
            return pairs.join(',');
        }
    }
})();
