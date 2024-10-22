import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { Rider } from "../models/Rider.model.js";
import { Restaurant } from "../models/Restaurant.model.js";
import { Medical } from "../models/Medical.model.js";
import { Hotel } from "../models/Hotel.model.js";
import { Flat } from "../models/Flat.model.js";
import { Laundry } from "../models/Laundry.model.js";

//Below there is no use of res so we can also write it as _ in production level these things are done like e.g below
//(req, _, next)
export const verifyUsersJWT = asyncHandler(async (req, res, next)=>{
  try {
      const token = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ","")
      console.log('token in server:', token, req.header("Authorization"));
    
      if(!token){
          throw new ApiError(401, "Unauthorized Request");
      }
     
     const decodedToken = jwt.verify(token, process.env.RefreshTokenSecret);
  
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
  
     if(!user){
      throw new ApiError(401, "Invalid Access Token");
     }
  
     req.user = user;
     console.log('req.user log:', req.user);
     
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


export const verifyHotelsJWT = asyncHandler(async (req, res, next)=>{
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
      if(!token){
          throw new ApiError(401, "Unauthorized Request");
      }
     
     const decodedToken = jwt.verify(token, process.env.AccessTokenSecret);
  
     const hotel = await Hotel.findById(decodedToken?._id).select("-password -refreshToken");
  
     if(!hotel){
      throw new ApiError(401, "Invalid Access Token");
     }
  
     req.hotel = hotel;
     next()
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid Access Token")
  }

})

export const verifyFlatsJWT = asyncHandler(async (req, res, next)=>{
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
      if(!token){
          throw new ApiError(401, "Unauthorized Request");
      }
     
     const decodedToken = jwt.verify(token, process.env.AccessTokenSecret);
  
     const flat = await Flat.findById(decodedToken?._id).select("-password -refreshToken");
  
     if(!flat){
      throw new ApiError(401, "Invalid Access Token");
     }
  
     req.flat = flat;
     next()
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid Access Token")
  }

})

export const verifyLaundryJWT = asyncHandler(async (req, res, next)=>{
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
      if(!token){
          throw new ApiError(401, "Unauthorized Request");
      }
     
     const decodedToken = jwt.verify(token, process.env.AccessTokenSecret);
  
     const laundry = await Laundry.findById(decodedToken?._id).select("-password -refreshToken");
  
     if(!laundry){
      throw new ApiError(401, "Invalid Access Token");
     }
  
     req.laundry = laundry;
     next()
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid Access Token")
  }

})