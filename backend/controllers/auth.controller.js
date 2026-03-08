const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { calculateBMI, getBMICategory } = require('../utils/calories');

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { email, password, full_name, gender, birth_date, height_cm, weight_kg, fitness_goal, activity_level } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'กรุณากรอก email, password และชื่อ' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
        }

        // Check if email already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, gender, birth_date, height_cm, weight_kg, fitness_goal, activity_level)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, password_hash, full_name, gender || null, birth_date || null, height_cm || null, weight_kg || null, fitness_goal || 'maintain', activity_level || 'moderate']
        );

        // Generate JWT
        const token = jwt.sign(
            { id: result.insertId, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'สมัครสมาชิกสำเร็จ!',
            token,
            user: {
                id: result.insertId,
                email,
                full_name,
                gender,
                fitness_goal: fitness_goal || 'maintain'
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'กรุณากรอก email และ password' });
        }

        // Find user
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ!',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                gender: user.gender,
                fitness_goal: user.fitness_goal
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, email, full_name, gender, birth_date, height_cm, weight_kg, fitness_goal, activity_level, profile_image, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }

        const user = users[0];

        // Calculate BMI if data available
        let bmi = null;
        let bmiCategory = null;
        if (user.weight_kg && user.height_cm) {
            bmi = calculateBMI(user.weight_kg, user.height_cm);
            bmiCategory = getBMICategory(bmi);
        }

        res.json({ ...user, bmi, bmiCategory });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, gender, birth_date, height_cm, weight_kg, fitness_goal, activity_level } = req.body;

        await pool.query(
            `UPDATE users SET full_name = COALESCE(?, full_name), gender = COALESCE(?, gender),
             birth_date = COALESCE(?, birth_date), height_cm = COALESCE(?, height_cm),
             weight_kg = COALESCE(?, weight_kg), fitness_goal = COALESCE(?, fitness_goal),
             activity_level = COALESCE(?, activity_level)
             WHERE id = ?`,
            [full_name, gender, birth_date, height_cm, weight_kg, fitness_goal, activity_level, req.user.id]
        );

        // Return updated user
        const [users] = await pool.query(
            'SELECT id, email, full_name, gender, birth_date, height_cm, weight_kg, fitness_goal, activity_level FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ', user: users[0] });
    } catch (error) {
        console.error('UpdateProfile error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
};
