

// import mongoose from "mongoose";

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from "./app.js";



dotenv.config({ path: "./.env" });

connectDB()
.then(() => {
    app.listen(process.env.port ||8000, ()=>{
        console.log(`servver is running at port : ${process.env.port }`);
         
    });
})
.catch((err) => {
    console.log("MONGO_DB CONNECTION FAILD !!!",err);
})     