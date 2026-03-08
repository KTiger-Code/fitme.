const pool = require('../config/db');
const { calculateBMI, getBMICategory } = require('../utils/calories');

// POST /api/weight — log weight
exports.logWeight = async (req, res) => {
    try {
        const { weight_kg, body_fat_pct, notes } = req.body;
        const log_date = req.body.log_date || new Date().toISOString().slice(0, 10);

        if (!weight_kg) {
            return res.status(400).json({ error: 'กรุณาระบุน้ำหนัก' });
        }

        // Get user height for BMI
        const [users] = await pool.query('SELECT height_cm FROM users WHERE id = ?', [req.user.id]);
        let bmi = null;
        if (users[0]?.height_cm) {
            bmi = calculateBMI(weight_kg, users[0].height_cm);
        }

        // Upsert
        await pool.query(
            `INSERT INTO weight_logs (user_id, weight_kg, body_fat_pct, bmi, log_date, notes)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), body_fat_pct = VALUES(body_fat_pct),
             bmi = VALUES(bmi), notes = VALUES(notes)`,
            [req.user.id, weight_kg, body_fat_pct || null, bmi, log_date, notes || null]
        );

        // Update user's current weight
        await pool.query('UPDATE users SET weight_kg = ? WHERE id = ?', [weight_kg, req.user.id]);

        res.json({
            message: 'บันทึกน้ำหนักสำเร็จ',
            weight_kg,
            bmi,
            bmi_category: bmi ? getBMICategory(bmi) : null
        });
    } catch (error) {
        console.error('logWeight error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/weight — history
exports.getWeightHistory = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM weight_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 90',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getWeightHistory error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/weight/latest
exports.getLatestWeight = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM weight_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 1',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.json({ message: 'ยังไม่มีข้อมูลน้ำหนัก' });
        }

        const log = rows[0];
        res.json({
            ...log,
            bmi_category: log.bmi ? getBMICategory(log.bmi) : null
        });
    } catch (error) {
        console.error('getLatestWeight error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};
