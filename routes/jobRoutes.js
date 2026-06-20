const router = require('express').Router();
const { createJob, getAllJobs, getJob, updateJob, deleteJob, getMyJobs, toggleJobStatus } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.get   ('/',           getAllJobs);
router.get   ('/myjobs',     protect, authorize('recruiter','admin'), getMyJobs);
router.post  ('/',           protect, authorize('recruiter','admin'), createJob);
router.get   ('/:id',        getJob);
router.put   ('/:id',        protect, authorize('recruiter','admin'), updateJob);
router.delete('/:id',        protect, authorize('recruiter','admin'), deleteJob);
router.put   ('/:id/toggle', protect, authorize('recruiter','admin'), toggleJobStatus);

module.exports = router;