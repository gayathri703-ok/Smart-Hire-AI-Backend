const router = require('express').Router();
const {
  getAllApplications,
  getJobApplications,
  updateApplicationStatus,
  getDashboardStats,
  getCandidateDetail
} = require('../controllers/recruiterController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('recruiter', 'admin'));

router.get('/stats',                      getDashboardStats);
router.get('/applications',               getAllApplications);
router.get('/jobs/:jobId/applications',   getJobApplications);
router.put('/applications/:id/status',    updateApplicationStatus);
router.get('/candidates/:userId',         getCandidateDetail);

module.exports = router;