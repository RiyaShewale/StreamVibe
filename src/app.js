import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cors({  //use is used for configuration and setting up middlewares
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({//allow data in json format
    limit: "16kb"
}))

app.use(express.urlencoded({//allow data in url format. needs nmore computing as urls add their own characters.
    extended: true, //allows objects within objects
    limit: "16kb"
}))

app.use(express.static("public"))//to store data received as it is like pdf or file or image etc. in  the public folder

app.use(cookieParser())
 






export {app}