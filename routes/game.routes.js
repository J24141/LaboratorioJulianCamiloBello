const express = require("express");
const router = express.Router();
const gameDao = require("../dao/game.dao");

router.get('/', gameDao.getAll);
router.get('/:id', gameDao.getById);
router.post('/', gameDao.create);

module.exports = router;