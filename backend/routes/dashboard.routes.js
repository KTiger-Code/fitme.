const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');

router.get('/summary', auth, ctrl.getSummary);
router.get('/streak', auth, ctrl.getStreak);
router.get('/weekly-stats', auth, ctrl.getWeeklyStats);
router.get('/monthly-stats', auth, ctrl.getMonthlyStats);
router.get('/achievements', auth, ctrl.getAchievements);

module.exports = router;
