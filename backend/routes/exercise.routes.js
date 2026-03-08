const router = require('express').Router();
const ctrl = require('../controllers/exercise.controller');
const auth = require('../middleware/auth');

router.get('/categories', auth, ctrl.getCategories);
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);

module.exports = router;
