import { FavouriteFoods } from "../models/FavouriteFoods.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { User } from "../models/User.model.js";

const toggleFavourite = asyncHandler(async (req, res) => {
    //get the userId from req.user
    //get the restaurantId from params
    //get foodItem and foodImg from the req.body
    //validate them all
    //create entry in db and update in the user db and validate
    //return res

    const {restaurantId} = req.params
    const {foodItem, foodImg} = req.body

    if(!restaurantId){
        throw new ApiError(400, "RestaurantId is required")
    }
    if(!(foodItem)){
        throw new ApiError(400, "Food Items is required")
    }

    const existingfavourite = await FavouriteFoods.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
                restaurant: new mongoose.Types.ObjectId(restaurantId),
                foodItem: foodItem
            }
        }
    ])
 console.log(existingfavourite);
    if(existingfavourite == ""){

        const favourite = await FavouriteFoods.create({
            user: new mongoose.Types.ObjectId(req.user._id),
            restaurant: new mongoose.Types.ObjectId(restaurantId),
            foodItem: foodItem
        })

        await User.findByIdAndUpdate(
            req.user._id,
            {
               $push: {
                  favouriteFoods: new mongoose.Types.ObjectId(favourite._id)
               }
            },
            {
               new: true
            })

        console.log(favourite);
        if(favourite == ""){
         throw new ApiError(400, "Error in creating new favourite")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, true, "New favourite Created Successfully"))

    }
    console.log(existingfavourite[0]._id);

    const favourite = await FavouriteFoods.findByIdAndDelete(new mongoose.Types.ObjectId(existingfavourite[0]._id))

    await User.findByIdAndUpdate(
        req.user._id,
        {
           $pull: {
              favouriteFoods: new mongoose.Types.ObjectId(favourite._id)
           }
        },
        {
           new: true
        })

        return res
        .status(200)
        .json(new ApiResponse(200, favourite, "favourite Removed By the User"))

})

const getAllFavourites = asyncHandler(async (req, res) => {
    //get the userId from the req.user
    //using mongoose aggregate match user from the favourite and validate
    //return res

    const favourite = await FavouriteFoods.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id)
            }
        }
    ])

    if(favourite == ""){
        throw new ApiError(400, "No Favourite Foods Found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, favourite, "Successfully fetched favourite foods"))

})

export {
    toggleFavourite,
    getAllFavourites
}