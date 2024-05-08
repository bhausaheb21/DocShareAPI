const path = require("path");
const { Folder, User, File } = require("../Models");
const fs = require('fs');
const { default: mongoose } = require("mongoose");


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
            return res.status(201).json({ message: "Uploaded Successfully", savedfile })
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
            const { email, fileId, level } = req.body;
            const user = await User.findOne({ email: email });
            const file = await File.findById(fileId);
            if (!user) {
                const error = new Error("Invalid User");
                error.status = 422;
                throw error;
            }
            if (file.owner.toString() !== userId.toString()) {
                const error = new Error("Unauthorized to Do this");
                error.status = 401;
                throw error;
            }

            user.sharedFiles.push({ file, sharedBy: req.user.email });
            file.access.push({
                user,
                level
            })
            await user.save();
            await file.save();
            return res.status(200).json({ message: "Shared Successdully" })
        } catch (error) {
            next(error);
        }
    }

    static async getSharedFiles(req, res, next) {
        try {
            const user = await User.findById(req.user.id).populate('sharedFiles.file');
            console.log(user.sharedFiles);
            const sharedFiles = []
            user.sharedFiles.map((value) => {
                console.log(value)
                sharedFiles.push({
                    name: value.file.name,
                    fileId: value.file._id,
                    sharedBy: value.sharedBy
                })
            })
            return res.status(200).json({ message: "Fetched Shared Document Successfully", documents: sharedFiles })
        }
        catch (err) {
            next(err)
        }
    }

    static async getAllFiles(req, res, next) {
        try {
            const userID = req.user.id;
            const user = await User.findById(userID);
            if (!user) {
                const error = new Error("Invalid User");
                error.status = 401;
                throw error;
            }
            const files = await File.find({ owner: user._id });

            const filelist = [];
            files.map((value) => {
                filelist.push({
                    name: value.name,
                    fileId: value._id
                })
            })
            return res.status(200).json({ message: "Fetched Successfully", files: filelist });

        } catch (error) {
            next(error)
        }
    }

    static async deleteFile(req, res, next) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Start MongoDB session

            const { fileId, parentFolder } = req.body;
            const userId = req.user.id;

            const file = await File.findById(fileId).session(session);

            if (!file) {
                const error = new Error("File not found");
                error.status = 404;
                throw error;
            }

            if (file.owner.toString() !== userId) {
                const error = new Error("Not authenticated to do it");
                error.status = 401;
                throw error;
            }

            const folder = await Folder.findById(parentFolder).session(session);
            folder.files = folder.files.filter((value) => {
                return value._id.toString() !== fileId.toString();
            });

            await folder.save({ session });
            const filepath = path.join(path.dirname(process.mainModule.filename), file.path);
            fs.unlink(filepath, async (err) => {
                const result = await File.findByIdAndDelete(fileId).session(session);
                await session.commitTransaction();
                session.endSession();
                return res.json({ message: "File Deleted Successfully", result });
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            next(error);
        }

    }

    static async deleteFolder(req, res, next) {
        const { folderId } = req.body;
        try {
            const folder = await Folder.findById(folderId);
            if (!folder) {
                const error = new Error("Invalid Folder");
                error.status = 404;
                throw error;
            }

            if (folder.owner.toString() !== req.user.id.toString()) {
                const error = new Error("Not Authorized");
                error.status = 401;
                throw error;
            }
            const result = await deleteFolderAndChildren(folderId);
            res.status(200).json({ message: "Folder Deleted Successfully" });
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


async function deleteFolderAndChildren(folderId) {
    try {
        const folder = await Folder.findById(folderId);
        if (!folder) {
            throw new Error("Folder not found");
        }
        const { folderIds, fileIds } = await gatherChildIds(folder);
        await Folder.deleteMany({ _id: { $in: folderIds } });
        await File.deleteMany({ _id: { $in: fileIds } });
        await Folder.findByIdAndDelete(folder._id)
        console.log("Deletion Sucessfull");
    } catch (error) {
        throw error;
    }
}

async function gatherChildIds(folder) {
    try {
        let folderIds = [folder._id];
        let fileIds = folder.files;

        for (const childFolderId of folder.subfolders) {
            const childFolder = await Folder.findById(childFolderId);
            if (childFolder) {
                const { folderIds: subFolderIds, fileIds: subFileIds } = await gatherChildIds(childFolder);
                folderIds = folderIds.concat(subFolderIds);
                fileIds = fileIds.concat(subFileIds);
            }
        }
        return { folderIds, fileIds };
    } catch (error) {
        throw error;
    }
}