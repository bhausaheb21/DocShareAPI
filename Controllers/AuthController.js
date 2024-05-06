const { User } = require("../Models");
const { getSalt, encryptPass, getToken } = require("../utils/AuthUtils");
const { getOtp, sendOTP } = require("../utils/OTPService");

class AuthController {
    static async signup(req, res, next) {
        try {
            const { email, name, password } = req.body;

            const exisitingUser = await User.findOne({ email: email })

            if (exisitingUser) {
                const error = new Error("Existing Account Associated with Email")
                error.status = 422;
                throw error;
            }
            const salt = await getSalt();
            const hashedpass = await encryptPass(password, salt)
            const { otp, otp_expiry } = getOtp();
            await sendOTP(otp, email)

            const user = new User({
                email,
                salt,
                name,
                password: hashedpass,
                otp: otp,
                otp_expiry: otp_expiry,
                verified: false,
            });

            const saveuser = await user.save();

            const payload = {
                id: saveuser._id,
                email: saveuser.email,
                name: saveuser.name,
                verified: saveuser.verified
            }

            const token = getToken(payload);
            return res.json({
                message: "SignUp Successful",
                token,
                verified: saveuser.verified
            })

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async verify(req, res, next) {
        try {
            const id = req.user.id;
            const { otp } = req.body;
            const user = await User.findById(id);
            if (parseInt(otp) === parseInt(user.otp) && new Date() <= user.otp_expiry) {
                user.verified = true;
                const finaluser = await user.save();
                const payload = {
                    id: finaluser._id,
                    email: finaluser.email,
                    name: finaluser.firstname,
                    verified: finaluser.verified
                }
                const token = getToken(payload);
                return res.status(200).json({
                    message: "Verification Successful",
                    token,
                    verified: finaluser.verified
                })
            }
            const error = new Error("Invalid OTP")
            error.status = 422;
            throw error;
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    // static async getotp(req, res, next) {
    //     try {
    //         const id = req.user.id;
    //         const customer = await Customer.findById(id);

    //         if (!customer) {
    //             const error = new Error("Invalid Customer")
    //             error.status = 422;
    //             throw error;
    //         }
    //         const { otp, otp_expiry } = getOtp();
    //         await sendOTP(otp, customer.phone)
    //         customer.otp = otp;
    //         customer.otp_expiry = otp_expiry;
    //         await customer.save()
    //         return res.status(200).json({ message: "OTP send Successfully", customer })
    //     } catch (error) {
    //         next(error)
    //     }
    // }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email: email });

            if (!user) {
                const error = new Error("Invalid Email")
                error.status = 422;
                throw error;
            }
            if (!user.verified) {
                const error = new Error("Not Verified")
                error.status = 401;
                throw error;
            }

            const match = (await encryptPass(password, user.salt)).toString() === user.password.toString();
            if (!match) {
                const error = new Error("Invalid Password");
                error.status = 422;
                throw error;
            }

            const payload = {
                id: user._id,
                email: user.email,
                name: user.firstname,
                verified: user.verified
            }
            const token = getToken(payload);
            return res.status(200).json({ message: "Login Successful", token, verified: user.verified })

        } catch (error) {
            next(error)
        }
    }
}

module.exports = AuthController