import {Router} from "express";
import { cancelOrder, getAllCancelledOrdersForRestaurant, getCancelledOrderById } from "../controllers/foodyCancelledOrders.controller.js";
import { verifyRestaurantsJWT, verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/cancel-order/:orderId")
    .post(cancelOrder)
    .get(getCancelledOrderById)

router.route("/get-all-restaurant-CancelledOrders").get( verifyRestaurantsJWT, getAllCancelledOrdersForRestaurant)

export default router