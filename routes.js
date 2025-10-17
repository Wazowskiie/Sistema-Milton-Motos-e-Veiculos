const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.send('API da Milton Motos funcionando!');
});

module.exports = router;
