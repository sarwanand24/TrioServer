import {Router} from "express";
import { payments, verification } from "../controllers/payments.controller.js";

const router = Router();

router.route("/create-order").post(payments)

router.route("/verifyPayment").post(verification)

export default router