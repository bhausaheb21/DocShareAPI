const { default: mongoose } = require("mongoose");

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    files: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],
    subfolders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    }],
});

module.exports = mongoose.model('Folder', folderSchema)