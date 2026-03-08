const router = require('express').Router();
const ctrl = require('../controllers/plan.controller');
const auth = require('../middleware/auth');

router.get('/templates', auth, ctrl.getTemplates);
router.get('/', auth, ctrl.getMyPlans);
router.get('/:id', auth, ctrl.getPlanDetail);
router.post('/', auth, ctrl.createPlan);
router.post('/:id/activate', auth, ctrl.activatePlan);
router.post('/:id/clone', auth, ctrl.clonePlan);
router.delete('/:id', auth, ctrl.deletePlan);
router.post('/:planId/days/:dayId/exercises', auth, ctrl.addExerciseToDay);
router.delete('/:planId/days/:dayId/exercises/:id', auth, ctrl.removeExerciseFromDay);
router.put('/:planId/days/:dayId', auth, ctrl.toggleRestDay);

module.exports = router;
