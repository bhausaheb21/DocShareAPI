const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { connectDB } = require('./utils/db')
const { UserRouter, FileRouter } = require('./Routes')


async function startServer() {

    const app = express()

    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: false }))

    const PORT = process.env.PORT || 8000;

    app.get('/', (req, res, next) => {
        res.status(200).json({ message: "Server Stared" })
    })

    app.use('/auth', UserRouter)
    app.use(FileRouter)

    await connectDB()

    app.use((err, req, res, next) => {
        let status = err.status;
        let message = err.message;
        console.log(err);
        if (!err.status) {
            status = 500;
            message = "Internal Server Error";
        }
        return res.status(status).json({ message })

    })
    app.listen(PORT, () => {
        console.log("Server Started at PORT ", PORT);
    })
}

startServer()

