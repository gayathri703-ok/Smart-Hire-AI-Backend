const router = require('express').Router();
const {
  applyForJob,
  getMyApplications,
  getApplication,
  withdrawApplication
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.post  ('/:jobId',         protect, authorize('candidate'), applyForJob);
router.get   ('/myapplications', protect, authorize('candidate'), getMyApplications);
router.get   ('/:id',            protect, getApplication);
router.delete('/:id',            protect, authorize('candidate'), withdrawApplication);

module.exports = router;