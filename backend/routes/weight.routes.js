const router = require('express').Router();
const ctrl = require('../controllers/weight.controller');
const auth = require('../middleware/auth');

router.post('/', auth, ctrl.logWeight);
router.get('/', auth, ctrl.getWeightHistory);
router.get('/latest', auth, ctrl.getLatestWeight);

module.exports = router;
