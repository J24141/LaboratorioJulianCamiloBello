const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const db = require('./services/mysql.service');

const CSV_PATH = path.join(__dirname, 'Online_game.csv');
const BATCH = 1000;

const CATEGORIES = { NA_Sales: 'NA', JP_Sales: 'JP', Global_Sales: 'GLOBAL' };

async function insertInBatches(conn, sql, rows) {
    for (let i = 0; i < rows.length; i += BATCH) {
        await conn.query(sql, [rows.slice(i, i + BATCH)]);
    }
}

async function main() {
    const raw = parse(fs.readFileSync(CSV_PATH), {
        columns: true, skip_empty_lines: true, trim: true, bom: true,
        delimiter: ';',
    });

    const records = [];
    let skipped = 0;
    for (const r of raw) {
        const year = parseInt(r.Year, 10);
        const sales = Object.keys(CATEGORIES).map((c) => parseFloat(String(r[c]).replace(',', '.')));
        if (!r.Name || !r.Platform || !r.Genre || !r.Publisher || sales.some(Number.isNaN)) {
            skipped++;
            console.warn(`Fila omitida (datos incompletos): ${JSON.stringify(r)}`);
            continue;
        }
        records.push({
            name: r.Name, platform: r.Platform, genre: r.Genre, publisher: r.Publisher,
            year: Number.isNaN(year) ? null : year,
            sales: Object.fromEntries(Object.keys(CATEGORIES).map((c, i) => [c, sales[i]])),
        });
    }
    console.log(`Leídas: ${raw.length} | válidas: ${records.length} | omitidas: ${skipped}`);

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            'INSERT IGNORE INTO sales (`sale-category`) VALUES ?',
            [Object.values(CATEGORIES).map((c) => [c])]
        );

        const platforms = [...new Set(records.map((r) => r.platform))].map((p) => [p]);
        await insertInBatches(conn, 'INSERT IGNORE INTO plataform (name) VALUES ?', platforms);

        const games = new Map();
        for (const r of records) {
            if (!games.has(r.name)) games.set(r.name, [r.name, r.genre, r.publisher]);
        }
        await insertInBatches(
            conn,
            'INSERT IGNORE INTO game (name, `gender-name`, `editorial-name`) VALUES ?',
            [...games.values()]
        );

        const [pRows] = await conn.query('SELECT idplataform, name FROM plataform');
        const [gRows] = await conn.query('SELECT idgame, name FROM game');
        const platformId = new Map(pRows.map((p) => [p.name, p.idplataform]));
        const gameId = new Map(gRows.map((g) => [g.name, g.idgame]));

        const seen = new Set();
        const launches = [];
        for (const r of records) {
            const gid = gameId.get(r.name);
            const pid = platformId.get(r.platform);
            const key = `${gid}|${pid}`;
            if (seen.has(key)) { console.warn(`Duplicado ignorado: ${r.name} / ${r.platform}`); continue; }
            seen.add(key);
            for (const [col, cat] of Object.entries(CATEGORIES)) {
                launches.push([gid, pid, cat, r.year, r.sales[col]]);
            }
        }
        await insertInBatches(
            conn,
            'INSERT IGNORE INTO launch (game_idgame, plataform_idplataform, `sales_sale-category`, year, amount) VALUES ?',
            launches
        );

        await conn.commit();
        console.log('Carga confirmada (commit).');
    } catch (err) {
        await conn.rollback();
        console.error('Error en la carga, se hizo rollback:', err.message);
        process.exitCode = 1;
    } finally {
        conn.release();
    }

    for (const t of ['game', 'plataform', 'sales', 'launch']) {
        const [[row]] = await db.query(`SELECT COUNT(*) AS total FROM ${t}`);
        console.log(`${t}: ${row.total} registros`);
    }
    await db.end();
}

main();