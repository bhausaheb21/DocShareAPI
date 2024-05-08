const { Router } = require('express');
const { AuthController, FileController } = require('../Controllers');
const { isAuth } = require('../Middlewares/isAuth');
const multer = require('multer');
const path = require('path');


const fileRouter = Router();


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './Files/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

fileRouter.use(isAuth)
fileRouter.get('/getAll', FileController.getAllFiles);
fileRouter.get('/shared', FileController.getSharedFiles)
fileRouter.get('/open', FileController.openFolder)
fileRouter.get('/openmy_drive', FileController.openMainFolder)
fileRouter.post('/createFolder', FileController.createFolder)
// fileRouter.delete('/deleteFolder',)

fileRouter.post('/uploadFile', upload.single('file'), FileController.uploadFile);
fileRouter.get('/loadfile', FileController.loadFile);
fileRouter.post('/share', FileController.Sharefile);
fileRouter.delete('/delete', FileController.deleteFile);
fileRouter.delete('/deleteFolder', FileController.deleteFolder);



module.exports = fileRouter;