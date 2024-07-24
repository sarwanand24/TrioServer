import { Router } from "express";
import { getOrderById, giveRatingandFeedback, placeOrder, updateOrderStatus } from "../controllers/laundryOrders.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/placeOrder/:riderId/:shopId/:userId").post(placeOrder)

router.route("/order/:orderId")
    .post(updateOrderStatus)
    .get(getOrderById)

router.route("/ratings/:orderId").post(giveRatingandFeedback)

export default router