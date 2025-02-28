import mongoose from "mongoose";
import { dbName } from "../constants.js";



export const connectDb = async() => {
	try{
		const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${dbName}`)
		console.log(`MongoDb Connectesd !! DB HOST : ${connectionInstance.connection.host}`)
	}
	catch(err) {
		console.log('MongoDb connection FAILED  ', err)
		process.exit(1)
	} 
}