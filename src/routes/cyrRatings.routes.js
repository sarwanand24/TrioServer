import {Router} from "express";
import { createRatings, deleteRatings, updateRatings } from "../controllers/cyrRatings.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create-ratings/:riderId").post(verifyUsersJWT, createRatings)

router.route("/:ratingsId")
    .post(updateRatings)
    .delete(deleteRatings)

export default router