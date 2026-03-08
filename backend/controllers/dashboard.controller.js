const pool = require('../config/db');
const { calculateBMR, calculateTDEE, calculateBMI, getBMICategory, calculateAge } = require('../utils/calories');

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const userId = req.user.id;

        // Get user info
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        // Today's calories
        const [todayCal] = await pool.query(
            `SELECT COALESCE(SUM(calories_burned), 0) as calories, COUNT(*) as exercises_done
             FROM workout_logs WHERE user_id = ? AND workout_date = ? AND is_completed = TRUE`,
            [userId, today]
        );

        // Today's total planned exercises
        const [activePlan] = await pool.query(
            'SELECT id FROM workout_plans WHERE user_id = ? AND is_active = TRUE LIMIT 1', [userId]
        );

        let totalExercisesToday = 0;
        if (activePlan.length > 0) {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = days[new Date().getDay()];
            const [planDay] = await pool.query(
                `SELECT COUNT(*) as cnt FROM workout_plan_exercises wpe
                 JOIN workout_plan_days wpd ON wpe.plan_day_id = wpd.id
                 WHERE wpd.plan_id = ? AND wpd.day_of_week = ? AND wpd.is_rest_day = FALSE`,
                [activePlan[0].id, dayName]
            );
            totalExercisesToday = planDay[0].cnt;
        }

        // Streak
        const streak = await calculateStreak(userId);

        // This week calories
        const [weekCal] = await pool.query(
            `SELECT COALESCE(SUM(calories_burned), 0) as total
             FROM workout_logs WHERE user_id = ? AND is_completed = TRUE
             AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [userId]
        );

        // Total workouts
        const [totalWorkouts] = await pool.query(
            `SELECT COUNT(DISTINCT workout_date) as total
             FROM workout_logs WHERE user_id = ? AND is_completed = TRUE`,
            [userId]
        );

        // Latest weight
        const [latestWeight] = await pool.query(
            'SELECT weight_kg, bmi FROM weight_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 1',
            [userId]
        );

        // BMR / TDEE
        let bmr = null, tdee = null;
        if (user.gender && user.weight_kg && user.height_cm && user.birth_date) {
            const age = calculateAge(user.birth_date);
            bmr = Math.round(calculateBMR(user.gender, user.weight_kg, user.height_cm, age));
            tdee = Math.round(calculateTDEE(bmr, user.activity_level));
        }

        // Achievements count
        const [achCount] = await pool.query(
            'SELECT COUNT(*) as cnt FROM user_achievements WHERE user_id = ?', [userId]
        );

        res.json({
            today: {
                calories_burned: Math.round(todayCal[0].calories),
                exercises_done: todayCal[0].exercises_done,
                total_exercises: totalExercisesToday,
                progress_percent: totalExercisesToday > 0
                    ? Math.round((todayCal[0].exercises_done / totalExercisesToday) * 100) : 0
            },
            streak,
            week_calories: Math.round(weekCal[0].total),
            total_workout_days: totalWorkouts[0].total,
            weight: latestWeight.length > 0 ? {
                kg: latestWeight[0].weight_kg,
                bmi: latestWeight[0].bmi,
                bmi_category: latestWeight[0].bmi ? getBMICategory(latestWeight[0].bmi) : null
            } : { kg: user.weight_kg, bmi: null, bmi_category: null },
            bmr,
            tdee,
            achievements_count: achCount[0].cnt,
            user: {
                full_name: user.full_name,
                fitness_goal: user.fitness_goal
            }
        });
    } catch (error) {
        console.error('getSummary error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// Calculate consecutive workout streak
async function calculateStreak(userId) {
    const [rows] = await pool.query(
        `SELECT DISTINCT workout_date FROM workout_logs
         WHERE user_id = ? AND is_completed = TRUE
         ORDER BY workout_date DESC LIMIT 60`,
        [userId]
    );

    if (rows.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // Check if today has a workout
    const todayStr = checkDate.toISOString().slice(0, 10);
    const dates = rows.map(r => {
        const d = r.workout_date instanceof Date ? r.workout_date : new Date(r.workout_date);
        return d.toISOString().slice(0, 10);
    });

    // If today isn't done yet, start from yesterday
    if (!dates.includes(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 60; i++) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (dates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// GET /api/dashboard/streak
exports.getStreak = async (req, res) => {
    try {
        const streak = await calculateStreak(req.user.id);
        res.json({ streak });
    } catch (error) {
        console.error('getStreak error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/dashboard/weekly-stats
exports.getWeeklyStats = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT workout_date, COALESCE(SUM(calories_burned), 0) as calories,
                    COUNT(*) as exercises_done
             FROM workout_logs
             WHERE user_id = ? AND is_completed = TRUE AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY workout_date ORDER BY workout_date`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getWeeklyStats error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/dashboard/monthly-stats
exports.getMonthlyStats = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT workout_date, COALESCE(SUM(calories_burned), 0) as calories,
                    COUNT(*) as exercises_done
             FROM workout_logs
             WHERE user_id = ? AND is_completed = TRUE AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY workout_date ORDER BY workout_date`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getMonthlyStats error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/dashboard/achievements
exports.getAchievements = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check and award achievements
        await checkAndAwardAchievements(userId);

        // Get all achievements with user status
        const [rows] = await pool.query(
            `SELECT a.*, ua.earned_at,
                    CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as earned
             FROM achievements a
             LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
             ORDER BY a.condition_type, a.condition_value`,
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('getAchievements error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

async function checkAndAwardAchievements(userId) {
    try {
        // Get all unearned achievements
        const [unearned] = await pool.query(
            `SELECT a.* FROM achievements a
             LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
             WHERE ua.id IS NULL`,
            [userId]
        );

        if (unearned.length === 0) return;

        // Get user stats
        const [totalWorkouts] = await pool.query(
            'SELECT COUNT(DISTINCT workout_date) as cnt FROM workout_logs WHERE user_id = ? AND is_completed = TRUE',
            [userId]
        );
        const [totalCalories] = await pool.query(
            'SELECT COALESCE(SUM(calories_burned), 0) as cnt FROM workout_logs WHERE user_id = ? AND is_completed = TRUE',
            [userId]
        );
        const [weightLogs] = await pool.query(
            'SELECT COUNT(*) as cnt FROM weight_logs WHERE user_id = ?', [userId]
        );
        const [plansCreated] = await pool.query(
            'SELECT COUNT(*) as cnt FROM workout_plans WHERE user_id = ? AND is_template = FALSE', [userId]
        );
        const streak = await calculateStreak(userId);

        const stats = {
            total_workouts: totalWorkouts[0].cnt,
            total_calories: totalCalories[0].cnt,
            weight_logs: weightLogs[0].cnt,
            plans_created: plansCreated[0].cnt,
            streak
        };

        for (const ach of unearned) {
            const value = stats[ach.condition_type] || 0;
            if (value >= ach.condition_value) {
                await pool.query(
                    'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
                    [userId, ach.id]
                );
            }
        }
    } catch (error) {
        console.error('checkAchievements error:', error);
    }
}
