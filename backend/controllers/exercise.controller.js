const pool = require('../config/db');

// GET /api/exercises — list all (with optional filters)
exports.getAll = async (req, res) => {
    try {
        const { category, difficulty, search, muscle } = req.query;
        let sql = `SELECT e.*, ec.name as category_name, ec.icon as category_icon
                    FROM exercises e
                    JOIN exercise_categories ec ON e.category_id = ec.id
                    WHERE 1=1`;
        const params = [];

        if (category) {
            sql += ' AND ec.name = ?';
            params.push(category);
        }
        if (difficulty) {
            sql += ' AND e.difficulty = ?';
            params.push(difficulty);
        }
        if (search) {
            sql += ' AND (e.name LIKE ? OR e.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (muscle) {
            sql += ' AND e.muscle_group LIKE ?';
            params.push(`%${muscle}%`);
        }

        sql += ' ORDER BY ec.id, e.name';

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('getAll exercises error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/exercises/categories
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM exercise_categories ORDER BY id');
        res.json(rows);
    } catch (error) {
        console.error('getCategories error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/exercises/:id
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.*, ec.name as category_name, ec.icon as category_icon
             FROM exercises e
             JOIN exercise_categories ec ON e.category_id = ec.id
             WHERE e.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบท่าออกกำลังกาย' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('getById exercise error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};
