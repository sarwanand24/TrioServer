import { CompanyEarnings } from "../models/CompanyEarnings.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const calculateEarningsFromAllThree = asyncHandler(async (req, res)=> {
   //update it on each order completed
})

export {
    calculateEarningsFromAllThree
}