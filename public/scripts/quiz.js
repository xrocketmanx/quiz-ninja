(function () {
    "use strict";

    var quizContainer = document.getElementById('quiz');
    var quizController = new QuizController(new QuizView(quizContainer), new QuizDb(ajaxUtil));
    quizController.load();

    function QuizController(quizView, quizDb) {
        this.load = function() {
            quizDb.load(2, function(quiz) {
                quizView.load(quiz);
                var quizUtil = new QuizUtil(quiz.questions, quiz.time, function(questions) {
                    quizView.showResult(quizUtil.getResult(questions, quiz.correctAnswers), questions.length);
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
        var quiz = {
            name: 'C++',
            likes: 17,
            description: 'Nice description of great quiz. This quiz is super and great. ' +
            'This quiz will help you to learn everything about this world.',
            time: 5,
            questions: [
                {
                    text: 'Question 1',
                    options: ['answer 1', 'answer 2', 'answer 3'],
                    type: 'multiple'
                },
                {
                    text: 'Question 2',
                    options: ['answer 1', 'answer 2', 'answer 3', 'answer 4'],
                    type: 'single'
                },
                {
                    text: 'Question 3',
                    type: 'field'
                }
            ],
            correctAnswers: {
                'Question 1': ['answer 2', 'answer 1'],
                'Question 2': ['answer 3'],
                'Question 3': ['answer']
            }
        };

        this.load = function(id, callback) {
            callback(quiz);
        }
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

        this.showResult = function(answered, all) {
            quizForm.innerHTML = '';
            var message = 'Result: '
                + answered + ' of ' + all;

            var result = document.createElement('p');
            result.className = 'quiz-result';
            result.appendChild(document.createTextNode(message));

            quizForm.appendChild(result);
        };

        this.onStartClick = function(callback) {
            startBtn.addEventListener('click', function() {
                startBtn.style.display = 'none';
                callback.apply(this, arguments);
            });
        };
    }
})();
