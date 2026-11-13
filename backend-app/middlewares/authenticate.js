import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {

    const authorization = req.headers.authorization;

    if(!authorization ?. startsWith("Bearer ") )
    {
        return res.status(401).json({
            success: false,
            message: "Authentication Token Required"
        });
    }

    const token = authorization.slice(7);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({
            success: false,
            message: "Authentication is not configured",
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, secret);
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }

    if (typeof decoded === "string" || !decoded.sub || !decoded.role) {
        return res.status(401).json({
            success: false,
            message: "Invalid authentication token",
        });
    }

    const user = await User.findById(decoded.sub).select(
        "role isActive accountStatus"
    );
    if (
        !user ||
        !user.isActive ||
        (user.accountStatus && user.accountStatus !== "active")
    ) {
        return res.status(401).json({
            success: false,
            message: "Account is inactive",
        });
    }

    req.user = { id: user._id.toString(), role: user.role };
    return next();

};