import { Router } from "express";
import { createRatings, deleteRatings, updateRatings } from "../controllers/cyrMedicoRatings.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create-ratings/:medicalId").post(verifyUsersJWT, createRatings)

router.route("/:ratingsId")
    .post(updateRatings)
    .delete(deleteRatings)

export default router