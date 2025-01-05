
import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"
import dotenv from "dotenv";
dotenv.config();


const connectDB = async () => {
    console.log("Starting MongoDB connection...");
    try {
        const conectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected!! DB HOST : ${conectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGDB connection FAILED",error);
        process.exit(1) //read abt process provided by node
    }
}

export default connectDB