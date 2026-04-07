import { requireAuth } from "@clerk/express";
import User from "../models/User.js";

export const protectRoute = [
    requireAuth({signInUrl:"/sign-in"}),
    async(req,res,next)=>{
        try {
            const clerkId = req.auth().userId;
            if(!clerkId) return res.status(401).json({msg:"Unauthorized - invalid token"});

            const user = await User.findOne({clerkId});
            if(!user) return res.status(404).json({msg:"User not found"});

            req.user = user;
            next();
        } catch (error) {
            console.log("Error in protectRoute middleware",error);
            return res.status(500).json({msg:"Internal server error"});
        }
    }
]
