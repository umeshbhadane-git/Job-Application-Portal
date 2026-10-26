import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";


// 1, Fetch the Secret Key from the .env file
const getJwtConfig = () => {

    const secret = process.env.JWT_SECRET;

    if(!secret)
    {
        throw new Error("JWT_SECRET is missing");
    }

    return {
        secret,
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }

}

// 2. Create the JWT Token
const createToken = (user) => {

    const {secret, expiresIn} = getJwtConfig();

    return jwt.sign(
        {
            role : user.role
        },
        secret,
        {
            subject: user._id.toString(),
            expiresIn,
        }
    );
};


// Creating the user object to send the response to frontend
const toPublicUser = (user) => ({
    
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt

});


// Register the User
export const registerUser = async (data) => {

    const existingUser = await User.findOne({
        email: data.email.toLowerCase(),
    });

    if(existingUser){
        const error = new Error("Email already registered");
        error.statusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await User.create({
        
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        role: data.role || "jobSeeker",

    });

    return {
        user: toPublicUser(user),
        token: createToken(user)
    };
};

// Login the User
export const loginUser = async ({email, password}) => {

    const user = await User.findOne(
    {
      email: email.toLowerCase(),

    }).select("+password");

    if(!user)
    {
        const error = new Error("Invalid email or password OR Register first");
        error.status = 401;
        throw error;
    }

    const matchPassword = await bcrypt.compare(
        password,
        user.password
    );

    if(!matchPassword)
    {
        const error = new Error("Invalid email or password");
        error.status = 401;
        throw error;
    }

    if (!user.isActive) 
    {
        const error = new Error("Account is inactive");
        error.statusCode = 403;
        throw error;
    }

    return {
        user: toPublicUser(user),
        token: createToken(user)

    };
};

export const getCurrentUser = async (userId) => {

    const user = await User.findById(userId);

    if(!user)
    {
        const error = new Error("User not found or inactive");
        error.status = 404;
        throw error;
    }

    return toPublicUser(user);

}