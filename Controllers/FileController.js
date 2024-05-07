const { Folder, User } = require("../Models");

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
            return res.status(200).json({ message: "Folder Opened Successfully", subfolders, files })
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
            return res.status(200).json({ message: "Folder Opened Successfully", subfolders, files })
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
}