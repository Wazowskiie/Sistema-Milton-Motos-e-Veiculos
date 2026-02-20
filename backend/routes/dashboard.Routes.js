const express = require('express');
const router = express.Router();

const controller = require('../controllers/dashboard.Controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, controller.getDashboard);

module.exports = router;
