import { Router } from "express";
import {
    addNonVegFoods,
    addToOrderHistory,
    addVegFoods,
    changeCurrentPassword, fetchAcceptReject, getAllNonVegFoods, getAllVegFoods, getCurrentRestaurant, getEarnings, getEarningsHistory, getOrderHistory, loginRestaurant, logoutRestaurant,
    refreshAccessToken, registerRestaurant, removeNonVegFoods, removeOrderHistory, removeVegFoods, setDeviceToken, signoutRestaurant,
    toggleAvailableStatus,
    updateAccountDetails,
    updateDetails,
    updateRestroLocation
} from "../controllers/restaurant.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyRestaurantsJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(upload.single("restaurantPhoto"), registerRestaurant)

router.route("/login").post(loginRestaurant)

//secured Routes

router.route("/logout").post(verifyRestaurantsJWT, logoutRestaurant)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/password-change").post(verifyRestaurantsJWT, changeCurrentPassword)

router.route("/current-restaurant").get(verifyRestaurantsJWT, getCurrentRestaurant)

router.route("/update-account-details").patch(verifyRestaurantsJWT, updateAccountDetails)

router.route("/signout").delete(verifyRestaurantsJWT, signoutRestaurant)

router.route("/addOrderHistory/:orderId").post(verifyRestaurantsJWT, addToOrderHistory)

router.route("/removeOrderHistory/:orderId").post(verifyRestaurantsJWT, removeOrderHistory)

router.route("/getOrderHistory").get(verifyRestaurantsJWT, getOrderHistory)

router.route("/addVegFoods").post(upload.single("image"),verifyRestaurantsJWT, addVegFoods)

router.route("/addNonVegFoods").post(upload.single("image"),verifyRestaurantsJWT, addNonVegFoods)

router.route("/removeVegFoods/:foodId").post(verifyRestaurantsJWT, removeVegFoods)

router.route("/removeNonVegFoods/:foodId").post(verifyRestaurantsJWT, removeNonVegFoods)

router.route("/getAllVegFoods").get(verifyRestaurantsJWT, getAllVegFoods)

router.route("/getAllNonVegFoods").get(verifyRestaurantsJWT, getAllNonVegFoods)

router.route("/set-device-token").post(verifyRestaurantsJWT, setDeviceToken);

router.route("/fetchAccept-Reject").get(verifyRestaurantsJWT, fetchAcceptReject);

router.route("/update-restro-location").post(verifyRestaurantsJWT, updateRestroLocation);

router.route("/toggle-availability").post(verifyRestaurantsJWT, toggleAvailableStatus);

router.route("/get-earnings").get(getEarnings);

router.route("/earning-history").get(getEarningsHistory);

router.route("/update-details").put(verifyRestaurantsJWT, updateDetails);

export default router