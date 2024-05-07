const { Router } = require('express');
const { AuthController, FileController } = require('../Controllers');
const { isAuth } = require('../Middlewares/isAuth');

const fileRouter = Router();

// fileRouter.post('/', AuthController.login)
// fileRouter.post('/signup', AuthController.signup)
fileRouter.use(isAuth)
fileRouter.get('/open', FileController.openFolder)
fileRouter.get('/openmy_drive', FileController.openMainFolder)
fileRouter.post('/createFolder', FileController.createFolder)


module.exports = fileRouter;