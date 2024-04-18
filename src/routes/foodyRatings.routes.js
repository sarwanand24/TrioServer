import { Router } from "express";
import { createRatings, deleteRatings, updateRatings } from "../controllers/foodyRatings.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create-ratings/:restaurantId").post(verifyUsersJWT, createRatings)

router.route("/:ratingsId")
    .post(updateRatings)
    .delete(deleteRatings)

export default router