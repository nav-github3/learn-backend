import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bodyParser from "body-parser";
const app = express();



app.use(cors( {
	origin: process.env.CORS_ORIGIN,
	credentials: true
}))

app.use(cookieParser());

//covert the encoded data comming from the client to json
app.use(express.json({extended: true , limit: "16kb"})); 

// limit the size of the request body to 16kb
app.use(express.json({limit : "16kb"}));   

//files and folder which used by our app like images 
app.use(express.static("public"));


// Importing routes

import userRoutes from "./routes/user.routes.js";


//Routes decalration 
app.use("/api/v1/user", userRoutes);
//http://localhost:5000/api/v1/user/register







export {app};