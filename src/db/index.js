import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const  connectDB = async () =>{
    try {
        
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log(`\n  mongoDB connected ! DB host :  ${connectionInstance.connection.host}`); 

    } catch (error) {
    
  
 
        console.log(`mongo--connection--error ${error}`);
        process.exit(1);    
    }
}

export default connectDB;



