import mongoose from "mongoose";

const CommentSchmea = mongoose.Schema(
    {
        username: {
            type: String,
            required: false
        },
        textData: {
            type: String,
            required: false
        }
    }
)

const AricleSchmea = mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        textData: {
            type: String,
            required: true
        },
        upvotes: {
            type: Number,
            required: false
        },
        downvotes: {
            type: Number,
            required: false
        },
        username: {
            type: String,
            required: true
        },
        comment: {
            type: [CommentSchmea],
            required: false
        }
    },
    {
        timestamps: true
    }
)

export const ArticleModel = mongoose.model('article', AricleSchmea)