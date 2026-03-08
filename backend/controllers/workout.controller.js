const pool = require('../config/db');
const { calculateExerciseCalories, estimateDuration } = require('../utils/calories');

// Helper: get day of week name
function getDayOfWeek(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date(date).getDay()];
}

// GET /api/workouts/today — today's workout from active plan
exports.getToday = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const dayOfWeek = getDayOfWeek(today);

        // Get user weight
        const [users] = await pool.query('SELECT weight_kg FROM users WHERE id = ?', [req.user.id]);
        const userWeight = users[0]?.weight_kg || 70;

        // Get active plan
        const [plans] = await pool.query(
            'SELECT * FROM workout_plans WHERE user_id = ? AND is_active = TRUE LIMIT 1',
            [req.user.id]
        );

        if (plans.length === 0) {
            return res.json({ message: 'ยังไม่มีแผนออกกำลังกายที่ใช้งานอยู่', plan: null, exercises: [], logs: [] });
        }

        const plan = plans[0];

        // Get today's plan day
        const [days] = await pool.query(
            'SELECT * FROM workout_plan_days WHERE plan_id = ? AND day_of_week = ?',
            [plan.id, dayOfWeek]
        );

        if (days.length === 0 || days[0].is_rest_day) {
            return res.json({ message: 'วันนี้เป็นวันพัก 🛌', plan, is_rest_day: true, exercises: [], logs: [] });
        }

        const planDay = days[0];

        // Get exercises for today
        const [exercises] = await pool.query(
            `SELECT wpe.*, e.name as exercise_name, e.met_value, e.muscle_group,
                    e.difficulty, e.description as exercise_description,
                    ec.name as category_name, ec.icon as category_icon
             FROM workout_plan_exercises wpe
             JOIN exercises e ON wpe.exercise_id = e.id
             JOIN exercise_categories ec ON e.category_id = ec.id
             WHERE wpe.plan_day_id = ?
             ORDER BY wpe.order_index`,
            [planDay.id]
        );

        // Get today's logs
        const [logs] = await pool.query(
            'SELECT * FROM workout_logs WHERE user_id = ? AND workout_date = ?',
            [req.user.id, today]
        );

        // Merge exercises with logs and estimate calories
        const merged = exercises.map(ex => {
            const log = logs.find(l => l.plan_exercise_id === ex.id);
            const durationMin = ex.duration_minutes || estimateDuration(ex.sets, ex.reps, ex.rest_seconds);
            const estCalories = calculateExerciseCalories(ex.met_value, userWeight, durationMin);

            return {
                ...ex,
                estimated_calories: Math.round(estCalories),
                is_completed: log ? log.is_completed : false,
                actual_sets: log ? log.sets_completed : null,
                actual_reps: log ? log.reps_completed : null,
                actual_duration: log ? log.duration_minutes : null,
                actual_calories: log ? log.calories_burned : null,
                log_id: log ? log.id : null
            };
        });

        const totalEstCalories = merged.reduce((sum, ex) => sum + ex.estimated_calories, 0);
        const totalBurnedCalories = merged.reduce((sum, ex) => sum + (ex.actual_calories || 0), 0);
        const completedCount = merged.filter(ex => ex.is_completed).length;

        res.json({
            plan,
            day_of_week: dayOfWeek,
            is_rest_day: false,
            exercises: merged,
            summary: {
                total_exercises: merged.length,
                completed: completedCount,
                total_estimated_calories: totalEstCalories,
                total_burned_calories: Math.round(totalBurnedCalories),
                progress_percent: merged.length > 0 ? Math.round((completedCount / merged.length) * 100) : 0
            }
        });
    } catch (error) {
        console.error('getToday error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// POST /api/workouts/complete — mark exercise as completed
exports.completeExercise = async (req, res) => {
    try {
        const { plan_exercise_id, exercise_id, sets_completed, reps_completed, duration_minutes } = req.body;
        const today = new Date().toISOString().slice(0, 10);

        // Get user weight
        const [users] = await pool.query('SELECT weight_kg FROM users WHERE id = ?', [req.user.id]);
        const userWeight = users[0]?.weight_kg || 70;

        // Get exercise MET value
        const [exercises] = await pool.query('SELECT met_value FROM exercises WHERE id = ?', [exercise_id]);
        if (exercises.length === 0) {
            return res.status(404).json({ error: 'ไม่พบท่าออกกำลังกาย' });
        }

        // Calculate actual duration if using reps
        let actualDuration = duration_minutes;
        if (!actualDuration && sets_completed && reps_completed) {
            actualDuration = estimateDuration(sets_completed, reps_completed, 60);
        }
        actualDuration = actualDuration || 5;

        // Calculate calories
        const calories = calculateExerciseCalories(exercises[0].met_value, userWeight, actualDuration);

        // Check if log already exists
        const [existing] = await pool.query(
            'SELECT id FROM workout_logs WHERE user_id = ? AND plan_exercise_id = ? AND workout_date = ?',
            [req.user.id, plan_exercise_id, today]
        );

        let logId;
        if (existing.length > 0) {
            // Update existing
            await pool.query(
                `UPDATE workout_logs SET sets_completed = ?, reps_completed = ?, duration_minutes = ?,
                 calories_burned = ?, is_completed = TRUE, completed_at = NOW() WHERE id = ?`,
                [sets_completed, reps_completed, actualDuration, calories, existing[0].id]
            );
            logId = existing[0].id;
        } else {
            // Insert new log
            const [result] = await pool.query(
                `INSERT INTO workout_logs (user_id, plan_exercise_id, exercise_id, workout_date, sets_completed, reps_completed, duration_minutes, calories_burned, is_completed, completed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
                [req.user.id, plan_exercise_id, exercise_id, today, sets_completed, reps_completed, actualDuration, calories]
            );
            logId = result.insertId;
        }

        // Get updated totals for today
        const [totals] = await pool.query(
            `SELECT COUNT(*) as completed_count, COALESCE(SUM(calories_burned), 0) as total_calories
             FROM workout_logs WHERE user_id = ? AND workout_date = ? AND is_completed = TRUE`,
            [req.user.id, today]
        );

        res.json({
            message: '✅ บันทึกสำเร็จ!',
            log_id: logId,
            calories_burned: Math.round(calories),
            duration_minutes: Math.round(actualDuration * 100) / 100,
            today_summary: {
                completed_count: totals[0].completed_count,
                total_calories: Math.round(totals[0].total_calories)
            }
        });
    } catch (error) {
        console.error('completeExercise error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// POST /api/workouts/uncomplete — un-mark exercise
exports.uncompleteExercise = async (req, res) => {
    try {
        const { plan_exercise_id } = req.body;
        const today = new Date().toISOString().slice(0, 10);

        await pool.query(
            'DELETE FROM workout_logs WHERE user_id = ? AND plan_exercise_id = ? AND workout_date = ?',
            [req.user.id, plan_exercise_id, today]
        );

        res.json({ message: 'ยกเลิกการบันทึกสำเร็จ' });
    } catch (error) {
        console.error('uncompleteExercise error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/workouts/history
exports.getHistory = async (req, res) => {
    try {
        const { from, to, limit: queryLimit } = req.query;
        let sql = `SELECT wl.*, e.name as exercise_name, ec.name as category_name, ec.icon as category_icon
                    FROM workout_logs wl
                    JOIN exercises e ON wl.exercise_id = e.id
                    JOIN exercise_categories ec ON e.category_id = ec.id
                    WHERE wl.user_id = ?`;
        const params = [req.user.id];

        if (from) { sql += ' AND wl.workout_date >= ?'; params.push(from); }
        if (to) { sql += ' AND wl.workout_date <= ?'; params.push(to); }

        sql += ' ORDER BY wl.workout_date DESC, wl.created_at DESC';

        const resultLimit = parseInt(queryLimit) || 100;
        sql += ' LIMIT ?';
        params.push(resultLimit);

        const [rows] = await pool.query(sql, params);

        // Group by date
        const grouped = {};
        rows.forEach(row => {
            const date = row.workout_date instanceof Date
                ? row.workout_date.toISOString().slice(0, 10)
                : row.workout_date;
            if (!grouped[date]) {
                grouped[date] = { date, exercises: [], total_calories: 0, completed_count: 0 };
            }
            grouped[date].exercises.push(row);
            grouped[date].total_calories += parseFloat(row.calories_burned) || 0;
            if (row.is_completed) grouped[date].completed_count++;
        });

        res.json(Object.values(grouped));
    } catch (error) {
        console.error('getHistory error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/workouts/calories/today
exports.getCaloriesToday = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const [rows] = await pool.query(
            `SELECT COALESCE(SUM(calories_burned), 0) as total_calories, COUNT(*) as exercise_count
             FROM workout_logs WHERE user_id = ? AND workout_date = ? AND is_completed = TRUE`,
            [req.user.id, today]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error('getCaloriesToday error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/workouts/calories/weekly
exports.getCaloriesWeekly = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT workout_date, COALESCE(SUM(calories_burned), 0) as total_calories, COUNT(*) as exercise_count
             FROM workout_logs
             WHERE user_id = ? AND is_completed = TRUE AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY workout_date
             ORDER BY workout_date`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getCaloriesWeekly error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};
