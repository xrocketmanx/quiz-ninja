/**
 * Scope of Quiz Library
 * @param {function} typeCheck checks type of value
 * @return {Quiz}
 */
var QuizUtil = (function(typeCheck) {
    "use strict";

    /**
     * Quiz that has timer. After timeout or test end
     * callback function is called. Changes questions
     * @param {Array}    questions
     * @param {Number}   time      time for quiz timer in minutes
     * @param {Function} callback  called after testing
     * with questions answers as parameter
     * @constructor
     */
    function Quiz(questions, time, callback) {
        typeCheck('questions', questions, 'array');
        typeCheck('time', time, 'number');
        typeCheck('callback', callback, 'function');

        var quizNavigator = new QuizNavigator(questions);
        var docManipulator = new DocumentManipulator();
        var quizElements;
        var timer;

        /**
         * Loads quiz DOM and bind handlers
         */
        this.loadQuiz = function() {
            quizElements = docManipulator.loadQuizDOM(questions.length);
            bindHandlers();
            initTimer();
        };

        /**
         * Starts quiz timer and loads first question
         */
        this.startQuiz = function() {
            docManipulator.setActiveQuestion(0, 'add');
            docManipulator.loadQuestion(quizNavigator.getCurrent());
            timer.start();
        };

        /**
         * Calculates number of correct answers
         * @param {Array} questions
         * @param {Object} correctAnswers
         * @returns {number}
         */
        this.getResult = function(questions, correctAnswers) {
            typeCheck('questions', questions, 'array');
            typeCheck('correctAnswers', correctAnswers, 'object');


            var answered = 0;
            for (var i = 0; i < questions.length; i++) {
                var userAnswers = questions[i].answers || [];
                var correctAnswer = correctAnswers[questions[i].text];

                for (var j = 0; j < correctAnswer.length; j++) {
                    var correct = true;
                    if (userAnswers.indexOf(correctAnswer[j]) < 0) {
                        correct = false;
                        break;
                    }
                }

                if (correct) answered++;
            }
            return answered;
        };

        function bindHandlers() {
            var onNavClick = function() {
                moveDecorator(quizNavigator.setCursor, this.innerHTML - 1);
            };
            for (var i = 0; i < quizElements.nav.childNodes.length; i++) {
                quizElements.nav.childNodes[i].addEventListener('click', onNavClick);
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
            docManipulator.setActiveQuestion(quizNavigator.getCursor(), 'remove');

            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            var success = moveFunction.call(quizNavigator, args);

            docManipulator.loadQuestion(quizNavigator.getCurrent());
            docManipulator.setActiveQuestion(quizNavigator.getCursor(), 'add');
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
                        var input = docManipulator.selectInput(i);
                        if (input.checked) {
                            answers.push(question.options[i]);
                        }
                    }
                    break;
                }
                case 'field': {
                    var input = docManipulator.selectInput();
                    if (input.value) {
                        answers.push(input.value);
                    }
                    break;
                }
            }

            if (answers.length > 0) {
                question.answers = answers;
                docManipulator.setAnsweredQuestion(quizNavigator.getCursor(), 'add');
            } else {
                question.answers = null;
                docManipulator.setAnsweredQuestion(quizNavigator.getCursor(), 'remove');
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
            callback(questions);
        }
    }

    /**
     * @class
     * Loads DOM objects for quiz if they are ommited
     * and manipulates DOM
     */
    function DocumentManipulator() {

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
            }
        };
        var INPUT_ID = "answer";

        var quizElements;

        /**
         * Loads DOM objects for quiz except questions
         * @param  {Number} questionsCount for navigation bar
         */
        this.loadQuizDOM = function(questionsCount) {
            typeCheck('questionsCount', questionsCount, 'number');

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
            typeCheck('question', question, 'object');

            var questionForm = quizElements.main.question;
            questionForm.innerHTML = '';
            questionForm.appendChild(document.createTextNode(question.text));

            var optionsForm = quizElements.main.optionsForm;
            optionsForm.innerHTML = '';
            switch(question.type) {
                case 'multiple': {
                    loadOptions(optionsForm, question, 'checkbox');
                    break;
                }
                case 'single': {
                    loadOptions(optionsForm, question, 'radio');
                    break;
                }
                case 'field': {
                    loadField(optionsForm, question);
                }
            }
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
            quizElements.nav.childNodes[questionIndex].classList[method]('active');
        };

        /**
         * Sets nav of question answered class
         * @param {Number} questionIndex
         * @param {String} method 'add' or 'remove'
         */
        this.setAnsweredQuestion = function(questionIndex, method) {
            quizElements.nav.childNodes[questionIndex].classList[method]('answered');
        };

        function loadOptions(form, question, type) {
            var options = question.options;
            for (var i = 0; i < options.length; i++) {
                var inputGroup = document.createElement('div');
                inputGroup.className = 'qu-input-group';
                var input = document.createElement('input');
                input.type = type;
                input.name = INPUT_ID;
                input.id = INPUT_ID + i;
                var label = document.createElement('label');
                label.htmlFor = INPUT_ID + i;
                label.appendChild(document.createTextNode(options[i]));

                inputGroup.appendChild(input);
                inputGroup.appendChild(label);
                form.appendChild(inputGroup);
            }

            if (question.answers) {
                for (var i = 0; i < options.length; i++) {
                    if (question.answers.indexOf(options[i]) >= 0) {
                        var input = document.querySelector('#' + INPUT_ID + i);
                        input.checked = true;
                    }
                }
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
                optionsForm = document.createElement('div');
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
        typeCheck('questions', questions, 'array');

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
            typeCheck('seconds', initialSeconds, 'number');
            typeCheck('action', action, 'function');

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

})(typeCheck);
