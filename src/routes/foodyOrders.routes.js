import {Router} from "express";
import { getOrderById, placeOrder, updateOrderStatus } from "../controllers/foodyOrders.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/placeOrder/:riderId/:userId/:restaurantId").post(placeOrder)

router.route("/order/:orderId")
    .put(updateOrderStatus)
    .get(getOrderById)

export default router