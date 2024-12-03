import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyHotelsJWT } from "../middlewares/auth.middleware.js";
import { addToOrderHistory, getCurrentHotel, getOrderHistory, loginHotel, registerHotel, toggleRoomStatus, updateHotelData } from "../controllers/hotel.controller.js";

const router = Router()

router.route("/register").post(upload.single("hotelPhoto"), registerHotel)

router.route("/login").post(loginHotel)

//secured Routes

router.route("/addOrderHistory/:orderId").post(verifyHotelsJWT, addToOrderHistory)

router.route("/getOrderHistory/:hotelId").get(getOrderHistory)

router.route("/updateHotel/:hotelId").put(updateHotelData)

router.route("/toggleRoomStatus").patch(verifyHotelsJWT, toggleRoomStatus)

router.route("/getCurrentHotel").get(verifyHotelsJWT, getCurrentHotel)

export default router