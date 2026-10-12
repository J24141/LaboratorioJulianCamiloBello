const express = require("express");
const router = express.Router();
const salesDao = require("../dao/sales.dao");

router.get('/', salesDao.getAll);
router.get('/:id', salesDao.getById);
router.post('/', salesDao.create);

module.exports = router;