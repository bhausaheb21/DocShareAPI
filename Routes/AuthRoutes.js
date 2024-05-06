const { Router } = require('express');
const { AuthController } = require('../Controllers');
const { isAuth } = require('../Middlewares/isAuth');

const userRouter = Router();

userRouter.post('/', AuthController.login)
userRouter.post('/signup', AuthController.signup)
userRouter.use(isAuth)
userRouter.post('/verify', AuthController.verify)


module.exports = userRouter;