import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyLaundryJWT } from "../middlewares/auth.middleware.js";
import { addToOrderHistory, getCurrentLaundry, getOrderHistory, loginLaundry, registerLaundry, getLaundryByCity } from "../controllers/Laundry.controller.js";

const router = Router()

router.route("/register").post(upload.single("shopPhoto"), registerLaundry)

router.route("/login").post(loginLaundry)

//secured Routes

router.route("/addOrderHistory/:orderId").post(verifyLaundryJWT, addToOrderHistory)

router.route("/getOrderHistory").get(verifyLaundryJWT, getOrderHistory)

router.route("/getCurrentLaundry").get(verifyLaundryJWT, getCurrentLaundry)

router.route("/laundry-by-city-hotel").get(getLaundryByCity)

export default router