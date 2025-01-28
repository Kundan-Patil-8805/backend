import mongoose,{Schema} from "mongoose";
import  JsonWebToken  from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema({

    username : {
        type : String ,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true 

    },
    email : {
        type : String ,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        

    },
    fullName : {
        type : String ,
        required : true,
        trim : true,
        index: true

    },
        avatar : {
        type : String ,// cloud url
        required : true,


    },
    coverImage:{
        type : String,   //cloud url
    },
    watchHistory :[{
        type : Schema.Types.ObjectId,
        ref : "Video"
    }
],
    password : {
        type : String ,
        required : true,
    trim : [true, 'Password is Required'],

    },
     refreshToken : {
        type : String,

     },

}, {timestamps : true})


userSchema.pre("save",function async (next){
        if (!this.isModified("password")) return next();


        this.password = bcrypt.hash(this.password,10)
        next()

} )

userSchema.method.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
userSchame.method.generteAccesToken = function () {
      return jwt.sign(
        {
           _id : this._id,
           email : this.email,
           username : this.username,
           fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
serSchame.method.generteRefreshToken = function () {
    return jwt.sign(
        {
           _id : this._id,
           
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export  const  User = mongoose.model('User', userSchema)