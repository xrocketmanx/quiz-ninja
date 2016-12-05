var express = require('express');
var router = express.Router();

router.post('/:type', function(req, res) {
    if (req.params.type === 'error') {
        console.error(req.body);
    } else {
        console.log(req.body);
    }
    res.send({code: 200});
});

module.exports = router;

