import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import listEndpoints from 'express-list-endpoints'; // ✅ Make sure this is imported

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
 

// import routes
import userRouter from './routes/user.routes.js'

app.use("/api/v1/users" , userRouter)



export {app}