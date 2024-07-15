import mongoose from "mongoose";
import jwt from 'jsonwebtoken'


const UserModelSchema = mongoose.Schema(
    {
        username : {
            type: String,
            required: true
        },
        password : {
            type: String,
            required: true
        },
        upvotes : {
            type: Array,
            required: false
        },
        downvotes : {
            type: Array,
            required: false
        }
    },
    {
        timestamps: true
    }
)

UserModelSchema.methods.generateToken = function() {
    try {
        return jwt.sign(
            {
                username: this.username,
                password: this.password
            },
            process.env.JWT_MAIN_TOKEN,
            {
                expiresIn: '1d'
            }
        )
    } catch (error) {
        console.log(error)
        return error
    }
}



export const UserModel = new mongoose.model('user-log-info', UserModelSchema)