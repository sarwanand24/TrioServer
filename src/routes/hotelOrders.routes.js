import {Router} from "express";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/placeOrder/:userId/:hotelId").post(placeOrder)

export default router