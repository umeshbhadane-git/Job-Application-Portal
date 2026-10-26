import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {

    const authorization = req.headers.authorization;

    if(!authorization ?. startsWith("Bearer ") )
    {
        return res.status(401).json({
            success: false,
            message: "Authentication Token Required"
        });
    }

    const token = authorization.slice(7);

    try{

        const secret = process.env.JWT_SECRET;

        if(!secret)
        {
            throw new Error("JWT_SECRET is missing");
        }

        const decoded = jwt.verify(token, secret);

        if( typeof decoded === "string" || !decoded.sub || !decoded.role )
        {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }

        req.user = {
            id: decoded.sub,
            role: decoded.role
        };

        next();

    }
    catch(error)
    {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });

    }

};