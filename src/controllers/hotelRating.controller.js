import { HotelRating } from "../models/HotelRating.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createRatings = asyncHandler(async (req, res) => {
    //get the user_id from req.user
    //get the restaurant_id from params
    //get the rating and feedback from req.body
    //validate all of them
    //create entry in db and validate
    //return res

    const { hotelId } = req.params
    const { rating, feedback } = req.body

    if (!hotelId) {
        throw new ApiError(400, "hotelId is required")
    }

    if (!(rating || feedback)) {
        throw new ApiError(400, "Rating or Feedback is required")
    }

    const ratings = await FoodyRating.create({
        hotel: new mongoose.Types.ObjectId(hotelId),
        ratedBy: new mongoose.Types.ObjectId(req.user._id),
        rating,
        feedback
    })

    if (!ratings) {
        throw new ApiError(400, "Error in creating Ratings")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, ratings, "Successfully added Ratings"))

})


export {
    createRatings,
}