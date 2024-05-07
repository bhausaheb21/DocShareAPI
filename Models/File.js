const mongoose = require('mongoose');


const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true,
    },

    access: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        level: {
            type: String,
            enum: ['read', 'edit'], // Specify allowed access levels
            required: true
        }
    }],

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
});

fileSchema.index({ owner: 1 });

module.exports = mongoose.model('File',fileSchema)