const {Router} = require('express')
const authController = require('../controllers/auth.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const  authRouter = Router()


/**
 * @router POST /api/auth/register
 * @description Register a new user
 * @access Public 
 */
authRouter.post("/register", authController.registerUserController)


/**
 * @router POST /api/auth/login
 * @description Login a user with email and password
 * @access Public
 */

authRouter.post("/login",authController.loginUserController)

/**
 * @route Get/api/auth/logout
 * @description logout a user by clearing the token cookie
 * @access public 
 */

authRouter.post("/logout",  authController.logoutUserController)
authRouter.get("/logout",  authController.logoutUserController)


/**
 * @route Get/api/auth/get-me
 * @description get the current logged in user details
 * @access private
 */

authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)


module.exports = authRouter