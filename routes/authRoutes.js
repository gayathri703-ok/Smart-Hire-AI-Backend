const router = require('express').Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',       register);
router.post('/login',          login);
router.get ('/me',             protect, getMe);
router.put ('/updateprofile',  protect, updateProfile);
router.put ('/changepassword', protect, changePassword);

module.exports = router;