import {Router} from "express";
import { depositAmount } from "../controllers/payments.controller.js";

const router = Router();

router.route("/card").post(depositAmount)

export default router