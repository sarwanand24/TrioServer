import { Router } from "express";
import {
    addNonVegFoods,
    addToOrderHistory,
    addVegFoods,
    changeCurrentPassword, getAllNonVegFoods, getAllVegFoods, getCurrentRestaurant, loginRestaurant, logoutRestaurant,
    refreshAccessToken, registerRestaurant, removeNonVegFoods, removeOrderHistory, removeVegFoods, setDeviceToken, signoutRestaurant,
    updateAccountDetails
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

router.route("/addVegFoods").post(upload.single("image"),verifyRestaurantsJWT, addVegFoods)

router.route("/addNonVegFoods").post(upload.single("image"),verifyRestaurantsJWT, addNonVegFoods)

router.route("/removeVegFoods/:foodId").post(verifyRestaurantsJWT, removeVegFoods)

router.route("/removeNonVegFoods/:foodId").post(verifyRestaurantsJWT, removeNonVegFoods)

router.route("/getAllVegFoods").get(verifyRestaurantsJWT, getAllVegFoods)

router.route("/getAllNonVegFoods").get(verifyRestaurantsJWT, getAllNonVegFoods)

router.route("/set-device-token").post(verifyRestaurantsJWT, setDeviceToken);

export default router