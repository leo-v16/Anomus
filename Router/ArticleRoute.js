import express from 'express'
import { ArticleModel } from '../Models/ArticleModel.js'
import { UserModel } from '../Models/UserModel.js'
import jwt from 'jsonwebtoken'

const ArticleRouter = express.Router()

function verifyToken(token, username) {
    try {
        jwt.verify(token, process.env.JWT_MAIN_TOKEN, function (error, decode) {
            if (decode.username == username) {
                return 1
            }
            return 0
        })
    } catch (error) {
        return 0
    }
}

ArticleRouter.post('/view', async (req, res) => {
    try {
        const articleId = req.body.articleId

        if (
            !articleId ||
            articleId.trim() == ''
        ) {
            return res.json({message: 'Invalid Article'})
        }
        const $article = await ArticleModel.findOne({_id: articleId})
        if (!$article) {
            return res.json({message: 'Article not Found'})
        }

        return res.status(200).json({message: 'Article Found', article: $article})

    } catch (error) {
        return res.json({message: error.message})
    }
})

ArticleRouter.get('/viewall', async (req, res) => {
    try {
        const postList = await ArticleModel.find().sort({upvotes: -1})
        const result = await UserModel.find({username: req.body.username}).project({_id: 0, upvotes: 1, downvote: 1})
        if (!result) {
            return res.json({message: 'Something Wrong with User'})
        }
        return res.json({postList: postList, voteList: result})
    } catch (error) {
        return res.json({message: error.message})
    }
})

ArticleRouter.post('/create', async (req, res) => {
    try {
        if (
            !req.body.title ||
            !req.body.textData ||
            !req.body.username ||
            !req.body.token
        ) {
            return res.json({message: 'Incomplete Request'})
        }
        
        try {
            jwt.verify(req.body.token, process.env.JWT_MAIN_TOKEN)
        } catch (error) {
            return res.json({message: error.message})
        }

        const newArctile = {
            title: req.body.title,
            textData: req.body.textData,
            username: req.body.username,
            upvotes: 0,
            downvotes: 0
        }

        const crearted = await ArticleModel.create(newArctile)
        if (crearted) {
            return res.status(200).json({message: 'Article Created Sucessfully'})
        } else {
            return res.json({message: 'Unable to Create Article'})
        }
    } catch (error) {
        console.log(error)
        return res.json({message: error.message})
    }
})

ArticleRouter.post('/comment/create', async (req, res) => {
    try {
        const textData = req.body.textData
        const username = req.body.username
        const articleId = req.body.articleId
        const token = req.body.token

        if(textData.trim() == '') {
            return res.json({message: 'Empty Comment'})
        }

        if (
            !textData ||
            !username ||
            !articleId ||
            !token
        ) {
            return res.json({message: 'Bad Request, Missing Property'})
        }

        let $verified = false

        try {
            jwt.verify(token, process.env.JWT_MAIN_TOKEN, function (error, decoded) {
                if (decoded.username == username) {
                    console.log('User Verified')
                    $verified = true
                } else {
                    console.log('User Not Verified')
                }
            })
        } catch (error) {
            return res.json({message: error})
        }

        if (!$verified) {
            return res.json({message: 'User Not Varified'})
        }

        const comment = {
            textData: textData,
            username: username
        }

        const newComment = await ArticleModel.findByIdAndUpdate(articleId, {$push: {"comment": comment}})
        if (!newComment) {
            res.json({message: 'Comment Failed'})
        }
        res.json({message: 'Comment Made Sucessfully'})
        
    } catch (error) {
        return res.json({message: error.message})
    }
})

ArticleRouter.post('/upvote', async (req, res) => {
    try {
        const token = req.body.token
        const username = req.body.username
        const articleId = req.body.articleId
        if (
            !token ||
            !username ||
            !articleId
        ) {
            return res.json({message: 'Icomplete Request'})
        }

        const $verified = verifyToken(token, username)
        if ($verified) {
            return res.json({message: 'User Not Verified'})
        }

        const targetArticle = await ArticleModel.findById(articleId)
        if (!targetArticle) {
            return res.json({message: 'Article Not Found!'})
        }

        const targetUser = await UserModel.findOne({username: username})
        if (!targetUser) {
            return res.json({message: 'User Not Found!'})
        }

        console.log(targetUser.upvotes)

        if (targetUser.downvotes.includes(articleId)) {
            await UserModel.updateOne({username: username}, {
                $pull: {
                    "downvotes": articleId
                }
            })
            await ArticleModel.findByIdAndUpdate(articleId, {
                $inc: {
                    "downvotes": -1
                }
            })
        }

        if (targetUser.upvotes.includes(articleId)) {
            const targetUserUpdate = await UserModel.updateOne({username: username}, {
                $pull: {
                    "upvotes": articleId
                }
            })
            // console.log(targetUserUpdate)
            const addDownvote = await ArticleModel.findByIdAndUpdate(articleId, { $inc: {'upvotes': -1}})
            if (addDownvote) {
                return res.json({message: 'Task Sucessfull', vote: addDownvote.upvotes})
            }
        } else {
            const targetUserUpdate = await UserModel.updateOne({username: username}, {
                $push: {
                    "upvotes": articleId
                }
            })
            // console.log(targetUserUpdate)
            const subDownvote = await ArticleModel.findByIdAndUpdate(articleId, { $inc: {'upvotes': 1}})
            if (subDownvote) {
                return res.json({message: 'Task Sucessfull', vote: subDownvote.upvotes})
            }
        }

        return res.json({message: 'Something went Wrong', vote: targetArticle.vote})


    } catch (error) {
        return res.json({message: error.message})
    }
})


ArticleRouter.post('/downvote', async (req, res) => {
    try {
        const token = req.body.token
        const username = req.body.username
        const articleId = req.body.articleId
        if (
            !token ||
            !username ||
            !articleId
        ) {
            return res.json({message: 'Icomplete Request'})
        }

        const $verified = verifyToken(token, username)
        if ($verified) {
            return res.json({message: 'User Not Verified'})
        }

        const targetArticle = await ArticleModel.findById(articleId)
        if (!targetArticle) {
            return res.json({message: 'Article Not Found!'})
        }

        const targetUser = await UserModel.findOne({username: username})
        if (!targetUser) {
            return res.json({message: 'User Not Found!'})
        }

        console.log(targetUser.upvotes)

        if (targetUser.upvotes.includes(articleId)) {
            await UserModel.updateOne({username: username}, {
                $pull: {
                    "upvotes": articleId
                }
            })
            await ArticleModel.findByIdAndUpdate(articleId, {
                $inc: {
                    "upvotes": -1
                }
            })
        }

        if (targetUser.downvotes.includes(articleId)) {

            const targetUserUpdate = await UserModel.updateOne({username: username}, {
                $pull: {
                    "downvotes": articleId
                }
            })
            // console.log(targetUserUpdate)
            const addDownvote = await ArticleModel.findByIdAndUpdate(articleId, { $inc: {'downvotes': -1}})
            if (addDownvote) {
                return res.json({message: 'Task Sucessfull', vote: addDownvote.upvotes})
            }
        } else {
            const targetUserUpdate = await UserModel.updateOne({username: username}, {
                $push: {
                    "downvotes": articleId
                }
            })
            // console.log(targetUserUpdate)
            const subDownvote = await ArticleModel.findByIdAndUpdate(articleId, { $inc: {'downvotes': 1}})
            if (subDownvote) {
                return res.json({message: 'Task Sucessfull', vote: subDownvote.upvotes})
            }
        }

        return res.json({message: 'Something went Wrong', vote: targetArticle.vote})


    } catch (error) {
        return res.json({message: error.message})
    }
})


export default ArticleRouter
