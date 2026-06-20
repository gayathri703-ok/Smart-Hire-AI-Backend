const router = require('express').Router();
const { quickAnalyze, analyzeAgainstJob, jobBoardScores } = require('../controllers/analyzerController');
const { protect, authorize } = require('../middleware/auth');

router.post('/quick',      protect, authorize('candidate'), quickAnalyze);
router.post('/job/:jobId', protect, authorize('candidate'), analyzeAgainstJob);
router.get ('/jobboard',   protect, authorize('candidate'), jobBoardScores);

module.exports = router;