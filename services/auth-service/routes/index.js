const express        = require('express');
const AuthController = require('../controllers/AuthController');
const jwtMiddleware  = require('../middleware/jwtMiddleware');

const router = express.Router();

router.post('/register',               AuthController.register);
router.post('/login',                  AuthController.login);
router.post('/refresh',                AuthController.refresh);
router.post('/logout',                 AuthController.logout);
router.get('/oauth/github',            AuthController.githubRedirect);
router.get('/oauth/github/callback',   AuthController.githubCallback);

router.get('/users/profile', jwtMiddleware, AuthController.profile);

module.exports = router;