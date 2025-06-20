import mongoose from "mongoose";
 const userschema=mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,required:true},
    about:{type:String},
    tags:{type:[String]},
    joinedon:{type:Date,default:Date.now},
    avatar: { type: String }, // URL or path to profile picture
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // for public space rules
    phone: { type: String }, // for OTP
    otp: { type: String }, // for OTP verification
    otpExpires: { type: Date }, // for OTP expiry
    postCountToday: { type: Number, default: 0 },
    lastPostDate: { type: String }
 })

 export default mongoose.model("User",userschema)