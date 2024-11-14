import { HotelRating } from "../models/HotelRating.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Hotel } from "../models/Hotel.model.js";

const createRatings = asyncHandler(async (req, res) => {
    //get the user_id from req.user
    //get the restaurant_id from params
    //get the rating and feedback from req.body
    //validate all of them
    //create entry in db and validate
    //return res

    const { hotelId } = req.params
    const { rating } = req.body

    if (!hotelId) {
        throw new ApiError(400, "hotelId is required")
    }

    console.log("Rating", rating);

    if (!rating) {
        throw new ApiError(400, "Rating or Feedback is required")
    }

    const ratings = await HotelRating.create({
        hotel: new mongoose.Types.ObjectId(hotelId),
        ratedBy: new mongoose.Types.ObjectId(req.user._id),
        rating
    })

    if (!ratings) {
        throw new ApiError(400, "Error in creating Ratings")
    }

    const hotelRating = await HotelRating.aggregate([
        {
            $match: {
                hotel: new mongoose.Types.ObjectId(hotelId)
            }
        },
        {
            $group: {
                _id: null, // Group by null to calculate aggregate over all documents
                averageRating: { $avg: "$rating" } // Calculate average of the 'rating' field
            }
        }
    ])

    console.log("hotelRating", hotelRating);
    console.log("Average Rating", hotelRating[0]);

    const hotel = await Hotel.findByIdAndUpdate(new mongoose.Types.ObjectId(hotelId),
        {
           $set: {
            ratings: hotelRating[0].averageRating
           }
        })

        console.log(hotel);

    return res
        .status(200)
        .json(new ApiResponse(200, ratings, "Successfully added Ratings"))

})


const ratingSummary = asyncHandler(async (req, res) => {
    const { hotelId } = req.params; // Extract the hotelId from the URL parameter

  try {
    const groupedRatings = await HotelRating.aggregate([
      {
        $match: { hotel: mongoose.Types.ObjectId(hotelId) } // Match the hotelId
      },
      {
        $group: {
          _id: "$rating",       // Group by the rating value
          count: { $sum: 1 }    // Count the number of ratings for each group
        }
      },
      {
        $sort: { _id: 1 }       // Sort by rating value (1, 2, 3, 4, 5)
      }
    ]);

    if (!groupedRatings.length) {
      return res.status(404).json({ error: 'No ratings found for this hotel.' });
    }

    return res.status(200).json({ data: groupedRatings });
  } catch (error) {
    console.error('Error fetching grouped ratings:', error);
    return res.status(500).json({ error: "Error fetching ratings" });
  }
})

export {
    createRatings,
    ratingSummary
}