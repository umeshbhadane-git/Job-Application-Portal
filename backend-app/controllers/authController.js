import { registerUser as registerUserService,
         loginUser as loginUserService,
         getCurrentUser as getCurrentUserService
        } 
        from "../services/authService.js";

import { registerSchema, loginSchema } from "../validators/authValidator.js";


const validate = (schema, data) => {

    const result = schema.safeParse(data);

    if(!result.success)
    {
        const error = new Error("Invalid Input");
        error.statusCode = 400;
        error.details = result.error.issues.map( (issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
        throw error;
    }

    return result.data;

}

const handleError = (res, error) => {

    if(error.code == 11000)
    {
        return res.status(409).json({
            success: false,
            message: "Email Already Registered"
        });
    }

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: 
            statusCode == 500
            ? "Internal Server Error" 
            : error.message,
        ...(error.details && { errors: error.details }),
    });

};

// Resgister Controller 

export const register = async (req, res) => {

    try{

        const data = validate(registerSchema, req.body);
        const result = await registerUserService(data);

        return res.status(201).json({
            success: true,
            message: "Registration Successfull",
            data: result
        });

    }
    catch(error){

        return handleError(res, error);

    }

};

// Login Controller

export const login = async (req, res) => {

    try{

        const data = validate(loginSchema, req.body);
        const result = await loginUserService(data);

        return res.status(200).json({
            success: true,
            message: "Login Successfull",
            data: result
        });

    }
    catch(error)
    {
        return handleError(res, error);
    }

};

// Get Current User

export const me = async (req, res) => {
    
    try{
        
        const user = await getCurrentUserService(req.user.id);

        return res.status(200).json({
            success: true,
            data: {user}
        });

    }
    catch(error)
    {
        return handleError(res, error);
    }
}