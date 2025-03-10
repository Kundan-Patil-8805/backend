import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({

    subscriber : {
        type : mongoose.Schema.Types.ObjectId,
        // one who is subscribing
        ref : "User"
    }

    ,
    
    channel : {
        type : mongoose.Schema.Types.ObjectId,
        // one to whome the "subscriber" is subscribing 
        ref : "User"
    }

}, {timestamps: true });

export default mongoose.model("subscription", subscriptionSchema);