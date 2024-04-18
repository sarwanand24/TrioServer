import {Router} from "express";
import { getAllFavourites, toggleFavourite } from "../controllers/favouriteFoods.controller.js";
import { verifyUsersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/toggle-favourite/:restaurantId").post(verifyUsersJWT, toggleFavourite)

router.route("/").get(verifyUsersJWT, getAllFavourites)

export default router