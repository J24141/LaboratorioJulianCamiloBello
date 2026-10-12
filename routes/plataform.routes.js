const express = require("express");
const router = express.Router();
const plataformDao = require("../dao/plataform.dao");

router.get('/', plataformDao.getAll);
router.get('/:id', plataformDao.getById);
router.post('/', plataformDao.create);

module.exports = router;