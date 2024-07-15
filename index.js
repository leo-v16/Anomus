import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { MONGODB_URL, PORT } from './config.js';
import LogInRouter from './Router/LogInRoute.js';
import ArticleRouter from './Router/ArticleRoute.js';

const app = express();

app.use(express.json())
app.use(cors());

app.get('/', (req, res) => {
    try {
        return res.status(200).json({message: 'WELCOME TO THE SERVER!'})
    } catch (error) {
        return res.status(200).json({message: error.message})
    }
})

app.use('/login', LogInRouter)
app.use('/article', ArticleRouter)

mongoose
.connect(MONGODB_URL)
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server Listening at http://localhost:${PORT}`)
    })
})
.catch((error) => {
    console.log(error)
})