import { Router } from "express";
import {
    addToCyrRatings,
    addToFoodyRatings,
    addTocyrCancelledOrders,
    addTocyrOrderHistory, addTofoodyCancelledOrders, addTofoodyOrderHistory, addToCyrMedicoCancelledOrders, addToCyrMedicoOrderHistory,
    changeCurrentPassword, getCurrentUser, getcyrOrderHistory, getfoodyOrderHistory, getCyrMedicoOrderHistory, loginUser, logoutUser, refreshAccessToken, registerUser,
    signoutUser, updateAccountDetails, updateUserAvatar, addToCyrMedicoRatings,
    getAllVegFoods,
    getAllNonVegFoods,
    getAllRestaurants,
    setDeviceToken,
    getAllHotels,
    getAllHotelsByCity,
    getAllHotelsForCoupleStay,
    getAllHotelsForFamilyStay,
    getAllFlats,
    getAllFlatsByCity,
    updateUserLocation,
    uploadOfferImage,
    getOfferImages,
    uploadCarouselImage,
    getCarouselImages,
    getFoodCarouselImages,
    uploadFoodCarouselImage
}
    from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(upload.single("profilePhoto"), registerUser)

router.route("/login").post(loginUser)

//secured Routes

router.route("/logout").post(verifyUsersJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/password-change").post(verifyUsersJWT, changeCurrentPassword)

router.route("/current-user").get(verifyUsersJWT, getCurrentUser)

router.route("/update-account-details").patch(verifyUsersJWT, updateAccountDetails)

router.route("/update-avatar").patch(verifyUsersJWT, upload.single("profilePhoto"), updateUserAvatar)

router.route("/signout").delete(verifyUsersJWT, signoutUser)

router.route("/addFoodyOrderHistory/:orderId").post(verifyUsersJWT, addTofoodyOrderHistory)

router.route("/addCyrMedicoOrderHistory/:orderId").post(verifyUsersJWT, addToCyrMedicoOrderHistory)

router.route("/addCyrOrderHistory/:orderId").post(verifyUsersJWT, addTocyrOrderHistory)

router.route("/addFoodyCancelledOrder/:orderId").post(verifyUsersJWT, addTofoodyCancelledOrders)

router.route("/addCyrMedicoCancelledOrder/:orderId").post(verifyUsersJWT, addToCyrMedicoCancelledOrders)

router.route("/addCyrCancelledOrder/:orderId").post(verifyUsersJWT, addTocyrCancelledOrders)

router.route("/addFoodyRatings/:ratingId").post(verifyUsersJWT, addToFoodyRatings)

router.route("/addCyrMedicoRatings/:ratingId").post(verifyUsersJWT, addToCyrMedicoRatings)

router.route("/addCyrRatings/:ratingId").post(verifyUsersJWT, addToCyrRatings)

router.route("/foody-order-history").get(verifyUsersJWT, getfoodyOrderHistory)

router.route("/cyrmedico-order-history").get(verifyUsersJWT, getCyrMedicoOrderHistory)

router.route("/cyr-order-history").get(verifyUsersJWT, getcyrOrderHistory)

router.route("/getAllVegFoods").post(getAllVegFoods)

router.route("/getAllNonVegFoods").post(getAllNonVegFoods)

router.route("/getAllRestaurants/:city").get(getAllRestaurants)

router.route("/set-device-token").post(verifyUsersJWT, setDeviceToken)

router.route("/getAllHotels").get(getAllHotels)

router.route("/get-all-hotels-by-city").post(getAllHotelsByCity)

router.route("/get-all-couple-hotels").post(getAllHotelsForCoupleStay)

router.route("/get-all-family-hotels").post(getAllHotelsForFamilyStay)

router.route("/getAllFlats").get(getAllFlats)

router.route("/get-all-flats-by-city").post(getAllFlatsByCity)

router.route("/update-user-location").post(verifyUsersJWT, updateUserLocation)

router.get('/carousel-images', getCarouselImages);

router.post('/carousel-images', upload.single("imageUrl"), uploadCarouselImage);

router.get('/offer-images', getOfferImages);

router.post('/offer-images',upload.single("imageUrl"), uploadOfferImage);

router.get('/food-carousel-images', getFoodCarouselImages);

router.post('/food-carousel-images', upload.single("imageUrl"), uploadFoodCarouselImage);

export default router