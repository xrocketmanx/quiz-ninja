var express = require('express');
var path = require('path');
var app = express();

var morgan = require('morgan');
app.use(morgan('dev'));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

app.use('/', express.static('public'));

app.use('/$', function(req, res) {
    res.redirect('/pages/index');
});

app.use('/pages', require('./routes/pages'));
app.use('/quizzes', require('./routes/quizzes.js'));
app.use('/log', require('./routes/log'));

var PORT = process.env['PORT'] || 3000;

app.listen(PORT, function() {
    console.log('listening on ' + PORT);
});