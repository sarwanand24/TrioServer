import { FoodyRating } from "../models/FoodyRating.model.js";
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

    const { restaurantId } = req.params
    const { rating, feedback } = req.body

    if (!restaurantId) {
        throw new ApiError(400, "RestaurantId is required")
    }

    if (!(rating || feedback)) {
        throw new ApiError(400, "Rating or Feedback is required")
    }

    const ratings = await FoodyRating.create({
        restaurant: new mongoose.Types.ObjectId(restaurantId),
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

const updateRatings = asyncHandler(async (req, res) => {
    //get the user_id from req.user
    //get the ratings_id from params
    //get the rating and feedback from req.body
    //validate all of them
    //update in db and validate
    //return res

    const { ratingsId } = req.params
    const { rating, feedback } = req.body

    if (!ratingsId) {
        throw new ApiError(400, "RatingsId is required")
    }

    if (!(rating || feedback)) {
        throw new ApiError(400, "Rating or Feedback is required")
    }

    const ratings = await FoodyRating.findByIdAndUpdate(new mongoose.Types.ObjectId(ratingsId),
        {
            $set: {
                rating: rating,
                feedback: feedback
            }
        },
        {
            new: true
        })

        if (!ratings?.length) {
            throw new ApiError(400, "Error in updating Ratings")
        }
    
        return res
            .status(200)
            .json(new ApiResponse(200, ratings, "Successfully updated Ratings"))

})

const deleteRatings = asyncHandler(async (req, res) => {
    //get the ratingsId from the params
    //validate it
    //$unset the id in the db
    //validate and return res

    const { ratingsId } = req.params

    if (!ratingsId) {
        throw new ApiError(400, "RatingsId is required")
    }

    const ratings = await FoodyRating.findByIdAndDelete(new mongoose.Types.ObjectId(ratingsId),
    {
        $unset: {
            _id: 1
        }
    })

    if (!ratings?.length) {
        throw new ApiError(400, "Error in deleting Ratings")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, ratings, "Successfully deleted Ratings"))

})


export {
    createRatings,
    updateRatings,
    deleteRatings
}