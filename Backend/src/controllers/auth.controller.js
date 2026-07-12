const UserModel = require('../models/user.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const tokenBlacklistModel = require('../models/blacklist.model')

const getCookieOptions = (req) => {
    const isSecureRequest =
        req.secure ||
        req.headers['x-forwarded-proto'] === 'https' ||
        process.env.NODE_ENV === 'production' ||
        process.env.RENDER === 'true';

    return {
        httpOnly: true,
        path: '/',
        sameSite: isSecureRequest ? 'none' : 'lax',
        secure: isSecureRequest,
        maxAge: 24 * 60 * 60 * 1000
    }
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and and password in th request body
 * @access Public
 */

async function registerUserController(req,res){

    const {username,email,password} = req.body

    if(!username || !email || !password){
        return res.status(400).json({
            message:"please provide all required fields"
        })
    }

    const isUserAlreadyExists =  await UserModel.findOne({
        $or:[{username},{email}]
    })

    if(isUserAlreadyExists){
        return res.status(400).json({
            message:"Account already exists with this email address or username"
        })
    }


    const hash = await bcrypt.hash(password,10)

    const newUser = new UserModel({
        username,
        email,
        password:hash
    })

    await newUser.save();


    const token = jwt.sign(
        {id:newUser._id,username:newUser.username},
        process.env.JWT_SECRET,
        {expiresIn:'1d'}

    )

    res.cookie("token", token, getCookieOptions(req))

    res.status(201).json({
        message:"user registered successfully",
        user:{
            id: newUser._id,
            username:newUser.username,
            email:newUser.email
        }
    })




}

/** 
 * @name loginUserController
 * @description login a user ,email and password in the request body 
 * @access Public
 */

async function loginUserController(req,res) {
    const {email,password} =req.body 

    const user = await UserModel.findOne({email})

    if (!user) {
        return res.status(400).json({
            message: "invalid email or password"
        })
    }

    const isPasswordValid  = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "invalid email or password"
        })
    }

    const token = jwt.sign(
        {id:user._id,username:user.username},
        process.env.JWT_SECRET,
        {expiresIn:'1d'}

    )

    res.cookie("token", token, getCookieOptions(req))
    res.status(200).json({
        message:"user logged in successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }

    })
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist 
 * @access Public
 */

async function logoutUserController(req,res){
    const token = req.cookies.token
    const cookieOptions = getCookieOptions(req)

    if(token){
        await tokenBlacklistModel.create({token})
    }

    res.clearCookie("token", cookieOptions)

    res.status(200).json({
        message:"user logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access private 
 */

async function getMeController (req,res){
    const user = await UserModel.findById(req.user.id)

    res.status(200).json({
        message : "user details fetched successfully",
        user:{
            id:user._id,
            username:user.username,
            email: user.email
        }
    })
}





module.exports = {registerUserController, loginUserController, logoutUserController, getMeController}