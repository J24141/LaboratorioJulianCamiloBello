const db = require('../services/mysql.service');

const CATEGORIES = ['NA', 'JP', 'GLOBAL'];

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT `sale-category` AS saleCategory FROM sales');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT `sale-category` AS saleCategory FROM sales WHERE `sale-category` = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { saleCategory } = req.body;
    if (!saleCategory || !CATEGORIES.includes(saleCategory)) {
      return res.status(400).json({ error: 'Bad Request' });
    }
    await db.query('INSERT INTO sales (`sale-category`) VALUES (?)', [saleCategory]);
    res.status(201).json({ saleCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create };