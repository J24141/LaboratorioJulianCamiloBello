const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const offset = parseInt(req.query.offset, 10) || 0;
    const [rows] = await db.query(
      `SELECT l.game_idgame, g.name AS game,
              l.plataform_idplataform, p.name AS plataform,
              l.\`sales_sale-category\` AS saleCategory, l.year, l.amount
       FROM launch l
       JOIN game g ON g.idgame = l.game_idgame
       JOIN plataform p ON p.idplataform = l.plataform_idplataform
       ORDER BY l.game_idgame, l.plataform_idplataform
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { gameId, plataformId, saleCategory } = req.params;
    const [rows] = await db.query(
      `SELECT game_idgame, plataform_idplataform,
              \`sales_sale-category\` AS saleCategory, year, amount
       FROM launch
       WHERE game_idgame = ? AND plataform_idplataform = ? AND \`sales_sale-category\` = ?`,
      [gameId, plataformId, saleCategory]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { gameId, plataformId, saleCategory, year, amount } = req.body;
    if (!gameId || !plataformId || !saleCategory || amount === undefined) {
      return res.status(400).json({ error: 'Bad Request' });
    }
    await db.query(
      'INSERT INTO launch (game_idgame, plataform_idplataform, `sales_sale-category`, year, amount) VALUES (?, ?, ?, ?, ?)',
      [gameId, plataformId, saleCategory, year ?? null, amount]
    );
    res.status(201).json({ gameId, plataformId, saleCategory, year: year ?? null, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create };