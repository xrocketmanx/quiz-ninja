var express = require('express');
var path = require('path');
var app = express();

var morgan = require('morgan');
app.use(morgan('dev'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

app.use('/', express.static('public'));

app.use('/$', function(req, res) {
    res.redirect('/pages/index');
});

app.use('/pages', require('./routes/pages'));

var PORT = process.env['PORT'] || 3000;

app.listen(PORT, function() {
    console.log('listening on ' + PORT);
});