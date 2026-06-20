const router = require('express').Router();
const { getAIFeedback } = require('../controllers/aiFeedbackController');
const { protect, authorize } = require('../middleware/auth');

router.post('/analyze', protect, authorize('candidate'), getAIFeedback);

module.exports = router;