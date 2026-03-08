const router = require('express').Router();
const ctrl = require('../controllers/workout.controller');
const auth = require('../middleware/auth');

router.get('/today', auth, ctrl.getToday);
router.post('/complete', auth, ctrl.completeExercise);
router.post('/uncomplete', auth, ctrl.uncompleteExercise);
router.get('/history', auth, ctrl.getHistory);
router.get('/calories/today', auth, ctrl.getCaloriesToday);
router.get('/calories/weekly', auth, ctrl.getCaloriesWeekly);

module.exports = router;
