import {Router} from "express";
import { getOrderById, getRiderUndeliveredOrders, getUserUndeliveredOrders, placeOrder, updateOrderStatus, updatePickupOrderStatus } from "../controllers/foodyOrders.controller.js";
import { verifyRidersJWT, verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/placeOrder/:riderId/:userId/:restaurantId").post(placeOrder)

router.route("/order/:orderId")
    .put(updateOrderStatus)
    .get(getOrderById)

    router.route("/order-update/:orderId").put(updatePickupOrderStatus)

    router.route("/getRiderUndeliveredOrders").get(verifyRidersJWT, getRiderUndeliveredOrders)

    router.route("/getUserUndeliveredOrders").get(verifyUsersJWT, getUserUndeliveredOrders)

export default router