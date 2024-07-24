import { Router } from "express";
import { cancelOrder, getCancelledOrderById } from "../controllers/laundryCancelledOrders.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/cancel-order/:orderId")
    .post(cancelOrder)
    .get(getCancelledOrderById)

export default router