const mongoose = require("mongoose")



const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:[true,"username already existed"],
        required:[true,"username is required"],
    },

    email:{
        type:String,
        unique:[true,"Account already existed with this email adress"],
        required:true,
    },

    password:{
        type:String,
        required:true

    }
})


const UserModel = mongoose.model("users",userSchema)

module.exports = UserModel