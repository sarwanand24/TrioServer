import {Router} from "express";
import { createRatings, ratingSummary } from "../controllers/hotelRatings.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create-ratings/:hotelId").post(verifyUsersJWT, createRatings);

router.route("/get-grouped-ratings/:hotelId").get(ratingSummary);

export default router