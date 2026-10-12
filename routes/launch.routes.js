const express = require("express");
const router = express.Router();
const launchDao = require("../dao/launch.dao");

router.get('/', launchDao.getAll);
router.get('/:gameId/:plataformId/:saleCategory', launchDao.getById);
router.post('/', launchDao.create);

module.exports = router;