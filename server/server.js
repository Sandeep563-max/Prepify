import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/database.js';
import {resume, selfDescription, jobDescription}from "./src/services/temp.js";
import { generateInterviewReport } from './src/services/ai.service.js';
connectDB();

generateInterviewReport({resume, selfDescription, jobDescription});







app.listen(process.env.PORT, ()=>{
    console.log(`server is running on port ${process.env.PORT}`);
});