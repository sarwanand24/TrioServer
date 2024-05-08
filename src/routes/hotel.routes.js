import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyHotelsJWT } from "../middlewares/auth.middleware.js";
import { addToOrderHistory, loginHotel, registerHotel } from "../controllers/hotel.controller.js";

const router = Router()

router.route("/register").post(upload.single("hotelPhoto"), registerHotel)

router.route("/login").post(loginHotel)

//secured Routes

router.route("/addOrderHistory/:orderId").post(verifyHotelsJWT, addToOrderHistory)

export default router