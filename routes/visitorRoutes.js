const express = require('express');
const { recordVisitor } = require('../controllers/visitorController');

const router = express.Router();

router.post('/hit', recordVisitor);

module.exports = router;
