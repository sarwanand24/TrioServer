import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { Rider } from "../models/Rider.model.js";
import { Restaurant } from "../models/Retaurant.model.js";
import { Medical } from "../models/Medical.model.js";

//Below there is no use of res so we can also write it as _ in production level these things are done like e.g below
//(req, _, next)
export const verifyUsersJWT = asyncHandler(async (req, res, next)=>{
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
      if(!token){
          throw new ApiError(401, "Unauthorized Request");
      }
     
     const decodedToken = jwt.verify(token, process.env.AccessTokenSecret);
  
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
  
     if(!user){
      throw new ApiError(401, "Invalid Access Token");
     }
  
     req.user = user;
     next()
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid Access Token")
  }

})

export const verifyRidersJWT = asyncHandler(async (req, res, next)=>{
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
      if(!token){
          throw new ApiError(401, "Unauthorized Request");
      }
     
     const decodedToken = jwt.verify(token, process.env.AccessTokenSecret);
  
     const rider = await Rider.findById(decodedToken?._id).select("-password -refreshToken");
  
     if(!rider){
      throw new ApiError(401, "Invalid Access Token");
     }
  
     req.rider = rider;
     next()
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid Access Token")
  }

})

export const verifyRestaurantsJWT = asyncHandler(async (req, res, next)=>{
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
      if(!token){
          throw new ApiError(401, "Unauthorized Request");
      }
     
     const decodedToken = jwt.verify(token, process.env.AccessTokenSecret);
  
     const restaurant = await Restaurant.findById(decodedToken?._id).select("-password -refreshToken");
  
     if(!restaurant){
      throw new ApiError(401, "Invalid Access Token");
     }
  
     req.restaurant = restaurant;
     next()
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid Access Token")
  }

})

export const verifyMedicalsJWT = asyncHandler(async (req, res, next)=>{
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
      if(!token){
          throw new ApiError(401, "Unauthorized Request");
      }
     
     const decodedToken = jwt.verify(token, process.env.AccessTokenSecret);
  
     const medical = await Medical.findById(decodedToken?._id).select("-password -refreshToken");
  
     if(!medical){
      throw new ApiError(401, "Invalid Access Token");
     }
  
     req.medical = medical;
     next()
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid Access Token")
  }

})