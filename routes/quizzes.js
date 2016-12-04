var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.send(require('./quizzes.json').map(function(quiz) {
        return {
            id: quiz.id,
            name: quiz.name,
            description: quiz.description,
            likes: quiz.likes
        }
    }));
});

router.get('/:id', function(req, res) {
   var quizzes = require('./quizzes.json');
   var quiz = quizzes.find(function(quiz) {
       return quiz.id == req.params.id;
   });
   res.send(quiz);
});

module.exports = router;
