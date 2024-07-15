import express from "express";
import { UserModel } from "../Models/UserModel.js";

const LogInRouter = express.Router()

LogInRouter.post('/', async (req, res) => {
    try {
        const username = req.body.username
        const password = req.body.password

        if (
            !username ||
            !password
        ) {
            return res.status(500).json({message: 'Username or Password not Entered'})
        }
        const userExists = await UserModel.findOne({username: username})
        if (userExists) {
            if (password === userExists.password) {
                return res.status(200).json({message: 'Log In Sucessfully', token: await userExists.generateToken(), username: username, verified: true})
            } else {
                return res.status(201).json({message: 'Incorrect Password'})
            }
        } else {
            const user = {
                username: username,
                password: password
            }
            const userCreated = await UserModel.create(user)
            if (userCreated) {
                return res.status(200).json({message: 'User Created Sucessfully', token: await userCreated.generateToken(), username: username, verified: true})
            } else {
                return res.status(201).json({message: 'User not Created'})
            }
        }
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
})

export default LogInRouter