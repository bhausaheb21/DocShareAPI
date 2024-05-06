const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    salt: {
        type: String, required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    resettoken: {
        type: String
    },
    token_expiry: {
        type: Date
    },
    otp: {
        type: Number,
    },
    otp_expiry: {
        type: Date
    }

}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
