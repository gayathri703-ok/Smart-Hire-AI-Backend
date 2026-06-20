const router = require('express').Router();
const { uploadResume, getResume, deleteResume } = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post  ('/', protect, authorize('candidate'), upload.single('resume'), uploadResume);
router.get   ('/', protect, authorize('candidate'), getResume);
router.delete('/', protect, authorize('candidate'), deleteResume);

module.exports = router;