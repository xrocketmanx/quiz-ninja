"use strict";

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

document.querySelector('.breadcrumb .active').innerHTML = quiz.name;

var quizUtil = new Quiz(quiz.questions, quiz.time, function(questions) {
    alert('Your have answered: ' + quizUtil.getResult(questions, quiz.correctAnswers));
});
quizUtil.loadQuiz();
quizUtil.startQuiz();