(function () {
    "use strict";

    var quizContainer = document.getElementById('quiz');
    var quizController = new QuizController(new QuizView(quizContainer), new QuizDb(ajaxUtil));
    quizController.load();

    function QuizController(quizView, quizDb) {
        this.load = function() {
            quizDb.load(quizView.getQueryParams().id, function(quiz) {
                quizView.load(quiz);
                var quizUtil = new QuizUtil(quiz.questions, quiz.time, function(questions) {
                    quizDb.loadAnswers(quiz.id, function(answers) {
                        quizView.showResult(quizUtil.getResult(questions, answers), questions.length);
                    });
                });
                quizView.onStartClick(function() {
                    quizUtil.loadQuiz();
                    quizView.showForm();
                    quizUtil.startQuiz();
                });
            });
        };
    }

    function QuizDb(ajax) {
        this.load = function(id, callback) {
            ajax.getJSON('/quizzes/' + id, function(quiz) {
                callback(quiz);
            }, function(error) {
                showError('failed to load quiz');
                throw error;
            });
        };

        this.loadAnswers = function(id, callback) {
            ajax.getJSON('/quizzes/' + id + '/answers', function(answers) {
                callback(answers);
            }, function(error) {
                showError('failed to load answers');
                throw error;
            });
        };
    }

    function QuizView(container) {
        var startBtn = container.querySelector('#start');
        var quizForm = container.querySelector('.qu-form');

        this.load = function(quiz) {
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

        this.showResult = function(stats, all) {
            quizForm.innerHTML = '';
            var message = 'Result: '
                + stats.answeredCorrect + ' of ' + all;

            var result = document.createElement('p');
            result.className = 'quiz-result';
            result.appendChild(document.createTextNode(message));

            quizForm.appendChild(result);
            for (var i = 0; i < stats.questionElements.length; i++) {
                quizForm.appendChild(stats.questionElements[i]);
            }
        };

        this.onStartClick = function(callback) {
            startBtn.addEventListener('click', function() {
                startBtn.style.display = 'none';
                callback.apply(this, arguments);
            });
        };
    }

    function showError(message) {
        alert('Error: ' + message);
    }
})();
