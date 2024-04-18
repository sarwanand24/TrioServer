import {Router} from "express";
import { getOrderById, placeOrder, updateOrderStatus } from "../controllers/cyrOrders.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/placeOrder/:riderId/:userId").post(placeOrder)

router.route("/order/:orderId")
    .post(updateOrderStatus)
    .get(getOrderById)

export default router