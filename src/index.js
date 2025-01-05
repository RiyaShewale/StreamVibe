//require('dotenv').config({path: './env'})

import dotenv from 'dotenv'
import mongoose from 'mongoose';
import { DB_NAME } from './constants.js';
import connectDB from './db/index.js'

dotenv.config({
    path: './env'
})


connectDB()







// this is one way of connecting the db in which we directly write the connection func in index.js
/*
import express from 'express';
const app = express()


(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror",(error) => {
            console.log("ERRR:",error);
            throw error
        })

        app.listen(process.env.PORT,() => {
            console.log(`App is listening on port: ${process.env.PORT}`)
        })
    } catch (error){
        console.log("ERROR: ",error)
        throw err
    }
})()
*/
