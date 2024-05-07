const { Router } = require('express');
const { AuthController } = require('../Controllers');
const { isAuth } = require('../Middlewares/isAuth');
const { User } = require('../Models');
const jwt = require('jsonwebtoken');

const userRouter = Router();
 
userRouter.post('/', AuthController.login)
userRouter.post('/signup', AuthController.signup)
userRouter.post('/reset-password', AuthController.ResetPassword);

userRouter.post('/reset_password/verify', (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            const error = new Error("Not Authenticated")
            error.status = 401;
            throw error;
        }
        const payload = jwt.verify(token, 'Reset');
        req.email = payload.email;
        next();
    }
    catch (err) {
        next(err)
    }
}, AuthController.Savepassword)
userRouter.use(isAuth)
userRouter.post('/verify', AuthController.verify)
userRouter.get('/user_auth', async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.verified) {
            res.status(200).json({ ok: true })
        }
        const error = new Error("Not Verified");
        error.status = 422;
        throw error;
    } catch (error) {
        next(error);
    }

})


module.exports = userRouter;