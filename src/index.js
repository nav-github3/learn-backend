import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose"
import { dbName } from "./constants.js"
import { connectDb } from "./db/index.js"


connectDb();

