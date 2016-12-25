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

/**
 * Scope of Quiz Library
 * @return {Quiz}
 */
var QuizUtil = (function() {
    "use strict";

    /**
     * Quiz that has timer. After timeout or test end
     * callback function is called. Changes questions
     * @param {Object} options contain questions, time, onEnd callback
     * with questions answers as parameter
     * @constructor
     */
    function Quiz(options) {
        var questions = options.questions;
        var time = options.time;
        var onEnd = options.onEnd;

        var quizNavigator = new QuizNavigator(questions);
        var quizView = new QuizView();
        var quizElements;
        var timer;

        /**
         * Loads quiz DOM and bind handlers
         */
        this.loadQuiz = function() {
            quizElements = quizView.loadQuizDOM(questions.length);
            bindHandlers();
            initTimer();
        };

        /**
         * Starts quiz timer and loads first question
         */
        this.startQuiz = function() {
            quizView.setActiveQuestion(0, 'add');
            quizView.loadQuestion(quizNavigator.getCurrent());
            timer.start();
        };

        /**
         * Calculates number of correct answers
         * @param {Array} questions with user answers
         * @param {Object} answers contains answers of all questions
         * @returns {number}
         */
        this.getResultStats = function(questions, answers) {
            var answeredCorrect = 0;
            for (var i = 0; i < questions.length; i++) {
                var userAnswers = questions[i].answers || [];
                var correctAnswers = answers[questions[i].text];

                var correct = true;
                for (var j = 0; j < correctAnswers.length; j++) {
                    if (userAnswers.indexOf(correctAnswers[j]) < 0) {
                        correct = false;
                        break;
                    }
                }

                if (correct) {
                    answeredCorrect++;
                    questions[i].correct = true;
                }
            }

            return {
                answeredCorrect: answeredCorrect,
                questionElements: quizView.renderResultStats(questions, answers)
            }
        };

        function bindHandlers() {
            var onNavClick = function() {
                moveDecorator(quizNavigator.setCursor, this.innerHTML - 1);
            };
            for (var i = 0; i < quizElements.nav.children.length; i++) {
                quizElements.nav.children[i].addEventListener('click', onNavClick);
            }

            quizElements.buttons.Next.addEventListener('click', moveNext);

            quizElements.buttons.Skip.addEventListener('click', moveNextUnanswered);

            quizElements.buttons.Previous.addEventListener('click', movePrev);

            quizElements.buttons.End.addEventListener('click', endQuiz);

            var askToEnd = true;
            quizElements.buttons.Answer.addEventListener('click', function() {
                saveAnswer();
                if (askToEnd) {
                    if (!moveNextUnanswered()) {
                        askToEnd = false;
                        var message = "You have answered all questions. End test?";
                        var choose = confirm(message);
                        if (choose) {
                            endQuiz();
                            return;
                        }
                        moveNext();
                    }
                } else {
                    moveNext();
                }
            });
        }

        function moveDecorator(moveFunction) {
            quizView.setActiveQuestion(quizNavigator.getCursor(), 'remove');

            var args = Array.prototype.slice.call(arguments, 1);
            var success = moveFunction.call(quizNavigator, args);

            quizView.loadQuestion(quizNavigator.getCurrent());
            quizView.setActiveQuestion(quizNavigator.getCursor(), 'add');
            return success;
        }

        function moveNext() {
            moveDecorator(quizNavigator.next);
        }

        function moveNextUnanswered() {
            return moveDecorator(quizNavigator.nextUnanswered);
        }

        function movePrev() {
            moveDecorator(quizNavigator.prev);
        }

        function saveAnswer() {
            var question = quizNavigator.getCurrent();
            var answers = [];

            switch(question.type) {
                case 'single':
                case 'multiple': {
                    for (var i = 0; i < question.options.length; i++) {
                        var input = quizView.selectInput(i);
                        if (input.checked) {
                            answers.push(question.options[i]);
                        }
                    }
                    break;
                }
                case 'field': {
                    var input = quizView.selectInput();
                    if (input.value) {
                        answers.push(input.value);
                    }
                    break;
                }
            }

            if (answers.length > 0) {
                question.answers = answers;
                quizView.setAnsweredQuestion(quizNavigator.getCursor(), 'add');
            } else {
                question.answers = null;
                quizView.setAnsweredQuestion(quizNavigator.getCursor(), 'remove');
            }
        }

        function initTimer() {
            timer = new Timer(Timer.convertToSeconds(0, time, 0), function(seconds) {
                showTime(seconds);
            }, endQuiz);
        }

        function showTime(seconds) {
            var minutes = Timer.getMinutesFromTime(seconds)
                .toLocaleString('en-US', { minimumIntegerDigits: 2 });
            var secs = Timer.getSecondsFromTime(seconds)
                .toLocaleString('en-US', { minimumIntegerDigits: 2 });
            quizElements.timerForm.innerHTML = minutes + ':' + secs;
        }

        function endQuiz() {
            timer.stop();
            onEnd(questions);
        }
    }

    /**
     * @class
     * Loads DOM objects for quiz if they are ommited
     * and manipulates DOM
     */
    function QuizView() {

        var CLASS_NAMES = {
            FORM_CLASS: 'qu-form',
            TIMER_CLASS: 'qu-timer',
            NAV_CLASS: 'qu-nav',
            QUESTION_CLASS: 'qu-question',
            OPTIONS_CLASS: 'qu-options',
            BUTTON_CLASSES: {
                'Previous': 'qu-btn-previous',
                'Next': 'qu-btn-next',
                'Skip': 'qu-btn-skip',
                'End': 'qu-btn-end',
                'Answer': 'qu-btn-answer'
            },
            RESULT_CLASS: 'question-result',
            CORRECT_CLASS: 'correct',
            WRONG_CLASS: 'wrong',
            CORRECT_ANSWER_CLASS: 'correct-answer'
        };
        var INPUT_ID = "answer";

        var quizElements;

        /**
         * Loads DOM objects for quiz except questions
         * @param  {Number} questionsCount for navigation bar
         */
        this.loadQuizDOM = function(questionsCount) {

            quizElements = {};
            var form = document.querySelector('.' + CLASS_NAMES.FORM_CLASS);

            quizElements.nav = loadNav(form, questionsCount);
            quizElements.timerForm = loadTimer(form);
            quizElements.main = loadMain(form);
            quizElements.buttons = loadButtons(form);

            return quizElements;
        };

        /**
         * Loads Question in DOM
         * @param  {Object} question
         */
        this.loadQuestion = function(question) {

            var questionTextElement = quizElements.main.question;
            loadQuestion(questionTextElement, question);

            var optionsForm = quizElements.main.optionsForm;
            loadInputs(optionsForm, question);
        };

        /**
         * Selects inputs on test form by index
         * if its specified
         * @param  {Number} index index of input
         * @return {Node}   input
         */
        this.selectInput = function(index) {
            var form = quizElements.main.optionsForm;
            return index !== undefined ?
                form.querySelector('#' + INPUT_ID + index) : form.querySelector('#' + INPUT_ID);
        };

        /**
         * Sets nav of question active class
         * @param {Number} questionIndex
         * @param {String} method 'add' or 'remove'
         */
        this.setActiveQuestion = function(questionIndex, method) {
            quizElements.nav.children[questionIndex].classList[method]('active');
        };

        /**
         * Sets nav of question answered class
         * @param {Number} questionIndex
         * @param {String} method 'add' or 'remove'
         */
        this.setAnsweredQuestion = function(questionIndex, method) {
            quizElements.nav.children[questionIndex].classList[method]('answered');
        };

        /**
         * Renders questions with answers
         * to show result of passing test
         * @param questions
         * @param answers of all questions
         * @returns {Array}
         */
        this.renderResultStats = function(questions, answers) {
            var resultStats = [];

            questions.forEach(function(question) {
                var correctAnswers = answers[question.text];
                var userAnswers = question.answers;

                var questionElement = document.createElement('div');
                questionElement.className = CLASS_NAMES.RESULT_CLASS;
                if (question.correct) {
                    questionElement.classList.add(CLASS_NAMES.CORRECT_CLASS);
                } else {
                    questionElement.classList.add(CLASS_NAMES.WRONG_CLASS);
                }

                var questionTextElement = quizElements.main.question.cloneNode(false);
                loadQuestion(questionTextElement, question);
                var optionsForm = quizElements.main.optionsForm.cloneNode(false);
                loadInputs(optionsForm, question);

                var inputs = optionsForm.querySelectorAll('input, textarea');
                Array.prototype.forEach.call(inputs, function(input, i) {
                    input.setAttribute('disabled', 'disabled');
                });

                if (question.type === 'field') {
                    if (!userAnswers || correctAnswers[0] !== userAnswers[0]) {
                        var answer = document.createElement('p');
                        answer.className = 'field-answer';
                        answer.appendChild(document.createTextNode(correctAnswers[0]));
                        optionsForm.appendChild(answer);
                    }
                } else {
                    question.options.forEach(function(option, i) {
                        if (correctAnswers.indexOf(option) >= 0) {
                            optionsForm.children[i].classList.add(CLASS_NAMES.CORRECT_ANSWER_CLASS);
                        }
                    });
                }

                questionElement.appendChild(questionTextElement);
                questionElement.appendChild(optionsForm);
                resultStats.push(questionElement);
            });

            return resultStats;
        };

        function loadQuestion(element, question) {
            element.innerHTML = '';
            element.appendChild(document.createTextNode(question.text));
        }
        
        function loadInputs(form, question) {
            form.innerHTML = '';
            switch(question.type) {
                case 'multiple': {
                    loadOptions(form, question, 'checkbox');
                    break;
                }
                case 'single': {
                    loadOptions(form, question, 'radio');
                    break;
                }
                case 'field': {
                    loadField(form, question);
                }
            }
        }

        function loadOptions(form, question, type) {
            var options = question.options;
            for (var i = 0; i < options.length; i++) {
                var inputGroup = document.createElement('li');
                inputGroup.className = 'qu-input-group';

                var input = document.createElement('input');
                input.type = type;
                input.name = INPUT_ID;
                input.id = INPUT_ID + i;
                if (question.answers && question.answers.indexOf(options[i]) >= 0) {
                    input.checked = true;
                }

                var label = document.createElement('label');
                label.htmlFor = INPUT_ID + i;
                label.appendChild(document.createTextNode(options[i]));

                inputGroup.appendChild(input);
                inputGroup.appendChild(label);
                form.appendChild(inputGroup);
            }
        }

        function loadField(form, question) {
            var input = document.createElement('textarea');
            input.id = INPUT_ID;
            input.name = INPUT_ID;
            form.appendChild(input);

            if (question.answers) {
                input.value = question.answers[0];
            }
        }

        function loadNav(form, questionsCount) {
            var ul = document.querySelector('.' + CLASS_NAMES.NAV_CLASS);

            if (!ul) {
                ul = document.createElement('ul');
                ul.classList.add(CLASS_NAMES.NAV_CLASS);
                form.appendChild(ul);
            }

            for (var i = 0; i < questionsCount; i++) {
                var li = document.createElement('li');
                li.appendChild(document.createTextNode(i + 1));
                ul.appendChild(li);
            }

            return ul;
        }

        function loadTimer(form) {
            var timerForm = document.querySelector('.' + CLASS_NAMES.TIMER_CLASS);
            if (timerForm) return timerForm;

            timerForm = document.createElement('span');
            timerForm.classList.add(CLASS_NAMES.TIMER_CLASS);
            form.appendChild(timerForm);

            return timerForm;
        }

        function loadMain(form) {
            var main = {};

            var question = document.querySelector('.' + CLASS_NAMES.QUESTION_CLASS);
            if (!question) {
                question = document.createElement('p');
                question.classList.add(CLASS_NAMES.QUESTION_CLASS);
                form.appendChild(question);
            }

            var optionsForm = document.querySelector('.' + CLASS_NAMES.OPTIONS_CLASS);
            if (!optionsForm) {
                optionsForm = document.createElement('ul');
                optionsForm.classList.add(CLASS_NAMES.OPTIONS_CLASS);
                form.appendChild(optionsForm);
            }

            main.question = question;
            main.optionsForm = optionsForm;
            return main;
        }

        function loadButtons(form) {
            var buttons = {};

            for (var key in CLASS_NAMES.BUTTON_CLASSES) {
                var button = document.querySelector('.' + CLASS_NAMES.BUTTON_CLASSES[key]);
                if (!button) {
                    button = document.createElement('div');
                    button.appendChild(document.createTextNode(key));
                    button.classList.add(CLASS_NAMES.BUTTON_CLASSES[key]);
                    form.appendChild(button);
                }
                buttons[key] = button;
            }

            return buttons;
        }
    }

    /**
     * Navigates through the questions using
     * cursor(index of current question)
     * @param {Array} questions Array of questions
     * @constructor
     */
    function QuizNavigator(questions) {
        var length = questions.length;
        var cursor = 0;

        /**
         * Returns current question
         * @return {Object}
         */
        this.getCurrent = function() {
            return questions[cursor];
        };

        /**
         * Moves to next question.
         * If next question doesnt exists
         * moves to first question.
         */
        this.next = function() {
            cursor = (cursor + 1) % length;
        };

        /**
         * Moves to next unanswered question.
         * Based on existing user's answers on
         * questions.
         */
        this.nextUnanswered = function() {
            var current = questions[cursor];
            this.next();
            while (questions[cursor].answers) {
                if (questions[cursor] === current) {
                    return false;
                }
                this.next();
            }
            return true;
        };

        /**
         * Moves to previous question.
         * If previous question doesnt exist
         * moves to last question
         */
        this.prev = function() {
            cursor = cursor - 1 < 0 ? length - 1 : cursor - 1;
        };

        /**
         * Sets cursor position. Can be negative
         * @param {Number} index new cursor position
         */
        this.setCursor = function(index) {
            cursor = index < 0 ? length + index : index % length;
        };

        /**
         * Returns cursor
         * @return {Number}
         */
        this.getCursor = function() {
            return cursor;
        };
    }

    /**
     * Sets timer that will call action every
     * second and give it current seconds and
     * in the end calls callback;
     * has time converting static methods
     * @param {Number}   seconds  timeout in seconds
     * @param {Function} action   actions every second
     * @param {Function} callback actions in the end
     * @constructor
     */
    function Timer(seconds, action, callback) {

        var interval;
        var initialSeconds = seconds;

        /**
         * Starts timer or restarts if arguments are omitted
         * (all parameters are optional)
         * @param  {Number} _seconds  timeout in seconds
         * @param  {Function} _action   action every second
         * @param  {Function} _callback actions in the end
         */
        this.start = function(_seconds, _action, _callback) {
            if (_seconds) {
                initialSeconds = _seconds;
            }
            if (_action) {
                action = _action;
            }
            if (_callback) {
                callback = _callback;
            }

            seconds = initialSeconds;
            start();
        };

        /**
         * Continues timer execution
         */
        this.timerContinue = function() {
            start();
        };

        /**
         * Stops execution of timer
         */
        this.stop = function() {
            if (interval) {
                clearInterval(interval);
            }
        };

        /**
         * Returns seconds of current Timer
         * state
         * @return {Number} seconds
         */
        this.getSeconds = function() {
            return seconds;
        };

        /**
         * Sets timeout in seconds
         * @param {Number} _seconds timeout
         */
        this.setTimeout = function(_seconds) {
            initialSeconds = _seconds;
        };

        function start() {
            action(seconds);
            interval = setInterval(function() {
                action(--seconds);
                if (seconds === 0) {
                    clearInterval(interval);
                    if (callback) callback();
                }
            }, 1000);
        }
    }

    /**
     * Convert time to seconds
     * @param  {Number} hours
     * @param  {Number} minutes
     * @param  {Number} seconds
     * @return {Number}         time in seconds
     */
    Timer.convertToSeconds = function(hours, minutes, seconds) {
        return hours * 3600 + minutes * 60 + seconds;
    };

    /**
     * Gets seconds from time in seconds
     * @param  {Number} seconds time in seconds
     * @return {Number}         seconds
     */
    Timer.getSecondsFromTime = function(seconds) {
        return seconds % 60;
    };

    /**
     * Gets minutes from time in seconds
     * @param  {Number} seconds time in seconds
     * @return {Number}         minutes
     */
    Timer.getMinutesFromTime = function(seconds) {
        return Math.floor(seconds / 60) % 60;
    };

    /**
     * Gets hours from time in seconds
     * @param  {Number} seconds time in seconds
     * @return {Number}       hours
     */
    Timer.getHoursFromTime = function(seconds) {
        return Math.floor(seconds / 3600);
    };

    return Quiz;

})();

function ErrorNotifier(container, timeout) {
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

var ProgressBar = (function () {
    "use strict";

    function ProgressBar(container) {
        var COEF = 1000;

        var bar = container.querySelector('.bar');
        var counter = container.querySelector('.counter');

        this.show = function(value, ms) {
            value = Math.abs(value) % 101;

            var step = COEF / ms;
            var timeDelta = ms * step / 100;

            var width = 0;
            bar.style.width = width;
            counter.innerHTML = width;

            var interval = setInterval(function() {
                if (width < value - step) {
                    width += step;

                    bar.style.width = width + '%';
                    counter.innerHTML = Math.floor(width) + '%';
                } else {
                    clearInterval(interval);
                    bar.style.width = value + '%';
                    counter.innerHTML = +value.toFixed(2) + '%';
                }
            }, timeDelta);
        };
    }

    ProgressBar.render = function() {
        var barContainer = document.createElement('div');
        barContainer.classList.add('progress-bar');

        var counter = document.createElement('span');
        counter.classList.add('counter');
        barContainer.appendChild(counter);

        var progress = document.createElement('div');
        progress.classList.add('bar');
        barContainer.appendChild(progress);

        return barContainer;
    };

    return ProgressBar;
})();

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
            progressBar.show(stats.answeredCorrect * 100 / length, 1000);

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
