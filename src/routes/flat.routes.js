import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyFlatsJWT } from "../middlewares/auth.middleware.js";
import { registerFlat, loginFlat, addToOrderHistory } from "../controllers/flat.controller.js";

const router = Router()

router.route("/register").post(upload.single("flatPhoto"), registerFlat)

router.route("/login").post(loginFlat)

//secured Routes

router.route("/addOrderHistory/:orderId").post(verifyFlatsJWT, addToOrderHistory)

export default router