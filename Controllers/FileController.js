const path = require("path");
const { Folder, User, File } = require("../Models");
const fs = require('fs')


module.exports = class FileController {
    static async openMainFolder(req, res, next) {
        try {
            const user = await User.findById(req.user.id);

            const folder = await Folder.findById(user.baseFolder._id).populate('subfolders').populate('files');

            if (!user) {
                const error = new Error("Unauthorized")
                error.status = 402;
                throw error;
            }

            const subfolders = []
            folder.subfolders.map((item, index) => {
                subfolders.push({
                    name: item.name,
                    folderId: item._id
                })
            })

            const files = [];
            folder.files.map((item, index) => {
                files.push({
                    name: item.name,
                    fileId: item._id
                })
            })
            return res.status(200).json({ message: "Folder Opened Successfully", subfolders, files, parentId: folder._id })
        }
        catch (err) {
            next(err)
        }
    }
    static async openFolder(req, res, next) {
        try {
            const { folderId } = req.query;
            const folder = await Folder.findById(folderId).populate('subfolders').populate('files');
            console.log(folder);
            if (folder.owner.toString() !== req.user.id.toString()) {
                const error = new Error("Unauthorized")
                error.status = 402;
                throw error;
            }

            const subfolders = []
            folder.subfolders.map((item, index) => {
                subfolders.push({
                    name: item.name,
                    folderId: item._id
                })
            })

            const files = [];
            folder.files.map((item, index) => {
                files.push({
                    name: item.name,
                    fileId: item._id
                })
            })
            return res.status(200).json({ message: "Folder Opened Successfully", subfolders, files, parentId: folder._id })
        }
        catch (err) {
            next(err);
        }
    }
    static async createFolder(req, res, next) {

        try {
            const { folderId, name } = req.body;

            const folder = await Folder.findById(folderId);

            if (folder.owner.toString() !== req.user.id.toString()) {
                const error = new Error("Unauthorized")
                error.status = 402;
                throw error;
            }

            const newFolder = new Folder({
                parentFolder: folderId,
                name,
                subfolders: [],
                files: [],
                owner: req.user.id
            });

            const createdFolder = await newFolder.save();
            folder.subfolders.push(createdFolder._id);
            await folder.save();
            return res.status(200).json({ message: "Folder created Successfully", folder: createdFolder })
        }
        catch (err) {
            next(err);
        }
    }

    // static async DeleteFolder(req, res, next) {
    //     try {
    //         const { folderId } = req.body;

    //         const folder = await Folder.findById(folderId);

    //         if (req.user.id.toString() !== folder.owner.toString()) {
    //             const error = new Error("You are not Allowed")
    //             error.status = 401;
    //             throw error;
    //         }
    //     }
    //     catch (err) {
    //         next(err)
    //     }
    // }

    static async uploadFile(req, res, next) {
        try {
            const user = req.user;
            const file = req.file;
            const { folderId } = req.body;

            if (!req.file) {
                const error = new Error("No file Uploaded")
                error.status = 400;
                throw error;
            }

            const folder = await Folder.findById(folderId);

            if (!folder) {
                const error = new Error("Folder Not Exist");
                fs.unlink(path.join(path.dirname(process.mainModule.filename), file.path), (err) => {
                    if (err)
                        console.log(err.message);
                    else console.log("Deleted Successfully");
                })
                error.status = 404;
                throw error;
            }

            console.log(file);
            const newfile = new File({ access: [], name: file.originalname, path: file.path, owner: user.id, size: file.size });
            const savedfile = await newfile.save();

            folder.files.push(savedfile._id);
            await folder.save();
            res.status(201).json({ message: "Uploaded Successfully", savedfile })
        }
        catch (err) {
            next(err)
        }
    }

    static async loadFile(req, res, next) {
        try {

            const { fileId } = req.query;
            const file = await File.findById(fileId)
            const access = file?.access?.map((value) => {
                return value.user.toString() === req.user.id.toString();
            })

            if (file.owner.toString() !== req.user.id.toString() && access.length <= 0) {
                const error = new Error("Not Authorized")
                error.status = 401;
                throw error;
            }
            const filePath = path.join(path.dirname(process.mainModule.filename), file.path);
            console.log(filePath);
            if (!fs.existsSync(filePath)) {
                return res.status(404).send('File not found');
            }

            const contentType = getContentType(file.name)
            res.setHeader('Content-Type', contentType);

            const fileStream = fs.createReadStream(filePath);

            fileStream.pipe(res);
        }
        catch (err) {
            next(err)
        }
    }

    static async Sharefile(req, res, next) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);
            const { email, fileId, level } = req.body;
            const file = await File.findById(fileId);
            if (file.owner.toString() !== user._id.toString()) {
                const error = new Error("Unauthorized to Do this");
                error.status = 401;
                throw error;
            }

            user.sharedFiles.push(file);
            file.access.push({
                user,
                level
            })
            await user.save();
            await file.save();
            return res.status(200).json({ message: "Shared Successdully"})
        } catch (error) {
            next(error);
        }
    }
}


const getContentType = (fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
        case '.pdf':
            return 'application/pdf';
        case '.doc':
        case '.docx':
            return 'application/msword';
        case '.ppt':
        case '.pptx':
            return 'application/vnd.ms-powerpoint';
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.txt':
            return 'text/plain';
        default:
            return 'application/octet-stream';
    }
}