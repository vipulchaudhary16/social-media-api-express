const router = require('express').Router();

router.get('/', (req, res) => {
    res.send('You are on the way to the users route');
});

module.exports = router;