const pool = require('../config/db');

// GET /api/plans — user's plans
exports.getMyPlans = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM workout_plans WHERE user_id = ? ORDER BY is_active DESC, updated_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getMyPlans error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/plans/templates
exports.getTemplates = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM workout_plans WHERE is_template = TRUE ORDER BY id'
        );
        res.json(rows);
    } catch (error) {
        console.error('getTemplates error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/plans/:id — plan detail with days and exercises
exports.getPlanDetail = async (req, res) => {
    try {
        const planId = req.params.id;

        // Get plan
        const [plans] = await pool.query('SELECT * FROM workout_plans WHERE id = ?', [planId]);
        if (plans.length === 0) {
            return res.status(404).json({ error: 'ไม่พบแผน' });
        }

        const plan = plans[0];

        // Check ownership (allow templates for everyone)
        if (!plan.is_template && plan.user_id !== req.user.id) {
            return res.status(403).json({ error: 'ไม่มีสิทธ์เข้าถึงแผนนี้' });
        }

        // Get days with exercises
        const [days] = await pool.query(
            'SELECT * FROM workout_plan_days WHERE plan_id = ? ORDER BY order_index',
            [planId]
        );

        for (let day of days) {
            const [exercises] = await pool.query(
                `SELECT wpe.*, e.name as exercise_name, e.met_value, e.muscle_group,
                        e.difficulty, ec.name as category_name, ec.icon as category_icon
                 FROM workout_plan_exercises wpe
                 JOIN exercises e ON wpe.exercise_id = e.id
                 JOIN exercise_categories ec ON e.category_id = ec.id
                 WHERE wpe.plan_day_id = ?
                 ORDER BY wpe.order_index`,
                [day.id]
            );
            day.exercises = exercises;
        }

        plan.days = days;
        res.json(plan);
    } catch (error) {
        console.error('getPlanDetail error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// POST /api/plans — create new plan
exports.createPlan = async (req, res) => {
    try {
        const { name, description, goal, difficulty, start_date, end_date, days } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'กรุณาระบุชื่อแผน' });
        }

        const [result] = await pool.query(
            `INSERT INTO workout_plans (user_id, name, description, goal, difficulty, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, description || null, goal || 'maintain', difficulty || 'beginner', start_date || null, end_date || null]
        );

        const planId = result.insertId;

        // Create days if provided
        if (days && Array.isArray(days)) {
            for (let i = 0; i < days.length; i++) {
                const day = days[i];
                const [dayResult] = await pool.query(
                    `INSERT INTO workout_plan_days (plan_id, day_of_week, is_rest_day, notes, order_index)
                     VALUES (?, ?, ?, ?, ?)`,
                    [planId, day.day_of_week, day.is_rest_day || false, day.notes || null, i + 1]
                );

                // Add exercises to the day
                if (day.exercises && Array.isArray(day.exercises)) {
                    for (let j = 0; j < day.exercises.length; j++) {
                        const ex = day.exercises[j];
                        await pool.query(
                            `INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index, notes)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [dayResult.insertId, ex.exercise_id, ex.sets || 3, ex.reps || 10, ex.duration_minutes || null, ex.rest_seconds || 60, j + 1, ex.notes || null]
                        );
                    }
                }
            }
        }

        res.status(201).json({ message: 'สร้างแผนสำเร็จ', planId });
    } catch (error) {
        console.error('createPlan error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// POST /api/plans/:id/activate — activate a plan
exports.activatePlan = async (req, res) => {
    try {
        // Deactivate all user's plans first
        await pool.query('UPDATE workout_plans SET is_active = FALSE WHERE user_id = ?', [req.user.id]);

        // Activate selected plan
        await pool.query(
            'UPDATE workout_plans SET is_active = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        res.json({ message: 'เปิดใช้แผนสำเร็จ' });
    } catch (error) {
        console.error('activatePlan error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// POST /api/plans/:id/clone — clone a template
exports.clonePlan = async (req, res) => {
    try {
        const templateId = req.params.id;

        // Get template
        const [templates] = await pool.query('SELECT * FROM workout_plans WHERE id = ? AND is_template = TRUE', [templateId]);
        if (templates.length === 0) {
            return res.status(404).json({ error: 'ไม่พบแผนสำเร็จรูป' });
        }

        const template = templates[0];

        // Clone plan
        const [result] = await pool.query(
            `INSERT INTO workout_plans (user_id, name, description, goal, difficulty, is_template, is_active)
             VALUES (?, ?, ?, ?, ?, FALSE, FALSE)`,
            [req.user.id, template.name, template.description, template.goal, template.difficulty]
        );
        const newPlanId = result.insertId;

        // Clone days and exercises
        const [days] = await pool.query('SELECT * FROM workout_plan_days WHERE plan_id = ? ORDER BY order_index', [templateId]);

        for (const day of days) {
            const [dayResult] = await pool.query(
                `INSERT INTO workout_plan_days (plan_id, day_of_week, is_rest_day, notes, order_index)
                 VALUES (?, ?, ?, ?, ?)`,
                [newPlanId, day.day_of_week, day.is_rest_day, day.notes, day.order_index]
            );

            const [exercises] = await pool.query(
                'SELECT * FROM workout_plan_exercises WHERE plan_day_id = ? ORDER BY order_index',
                [day.id]
            );

            for (const ex of exercises) {
                await pool.query(
                    `INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [dayResult.insertId, ex.exercise_id, ex.sets, ex.reps, ex.duration_minutes, ex.rest_seconds, ex.order_index, ex.notes]
                );
            }
        }

        res.status(201).json({ message: 'คัดลอกแผนสำเร็จ', planId: newPlanId });
    } catch (error) {
        console.error('clonePlan error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// DELETE /api/plans/:id
exports.deletePlan = async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM workout_plans WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบแผนหรือไม่มีสิทธ์ลบ' });
        }

        res.json({ message: 'ลบแผนสำเร็จ' });
    } catch (error) {
        console.error('deletePlan error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// POST /api/plans/:planId/days/:dayId/exercises — add exercise to day
exports.addExerciseToDay = async (req, res) => {
    try {
        const { exercise_id, sets, reps, duration_minutes, rest_seconds, notes } = req.body;

        // Verify the day belongs to user's plan
        const [days] = await pool.query(
            `SELECT wpd.* FROM workout_plan_days wpd
             JOIN workout_plans wp ON wpd.plan_id = wp.id
             WHERE wpd.id = ? AND wp.user_id = ?`,
            [req.params.dayId, req.user.id]
        );

        if (days.length === 0) {
            return res.status(404).json({ error: 'ไม่พบวันในแผน' });
        }

        // Get next order_index
        const [maxOrder] = await pool.query(
            'SELECT COALESCE(MAX(order_index), 0) as max_order FROM workout_plan_exercises WHERE plan_day_id = ?',
            [req.params.dayId]
        );

        const [result] = await pool.query(
            `INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.params.dayId, exercise_id, sets || 3, reps || 10, duration_minutes || null, rest_seconds || 60, maxOrder[0].max_order + 1, notes || null]
        );

        res.status(201).json({ message: 'เพิ่มท่าสำเร็จ', id: result.insertId });
    } catch (error) {
        console.error('addExerciseToDay error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// DELETE /api/plans/:planId/days/:dayId/exercises/:id
exports.removeExerciseFromDay = async (req, res) => {
    try {
        await pool.query('DELETE FROM workout_plan_exercises WHERE id = ?', [req.params.id]);
        res.json({ message: 'ลบท่าสำเร็จ' });
    } catch (error) {
        console.error('removeExerciseFromDay error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// PUT /api/plans/:planId/days/:dayId — toggle rest day
exports.toggleRestDay = async (req, res) => {
    try {
        const { is_rest_day } = req.body;

        // Verify - belongs to user's plan
        const [days] = await pool.query(
            `SELECT wpd.* FROM workout_plan_days wpd
             JOIN workout_plans wp ON wpd.plan_id = wp.id
             WHERE wpd.id = ? AND wp.user_id = ?`,
            [req.params.dayId, req.user.id]
        );

        if (days.length === 0) {
            return res.status(404).json({ error: 'ไม่พบวันในแผน' });
        }

        await pool.query(
            'UPDATE workout_plan_days SET is_rest_day = ? WHERE id = ?',
            [is_rest_day ? 1 : 0, req.params.dayId]
        );

        res.json({ message: is_rest_day ? 'ตั้งเป็นวันพักแล้ว' : 'ยกเลิกวันพักแล้ว' });
    } catch (error) {
        console.error('toggleRestDay error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};
