import { Router } from "express";
import {
    addToOrderHistory,
    changeCurrentPassword, getCurrentMedical, loginMedical, logoutMedical,
    refreshAccessToken, registerMedical, removeOrderHistory, signoutMedical,
    updateAccountDetails
} from "../controllers/medical.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyMedicalsJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(upload.single("MedicalPhoto"), registerMedical)

router.route("/login").post(loginMedical)

//secured Routes

router.route("/logout").post(verifyMedicalsJWT, logoutMedical)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/password-change").post(verifyMedicalsJWT, changeCurrentPassword)

router.route("/current-medical").get(verifyMedicalsJWT, getCurrentMedical)

router.route("/update-account-details").patch(verifyMedicalsJWT, updateAccountDetails)

router.route("/signout").delete(verifyMedicalsJWT, signoutMedical)

router.route("/addOrderHistory/:orderId").post(verifyMedicalsJWT, addToOrderHistory)

router.route("/removeOrderHistory/:orderId").post(verifyMedicalsJWT, removeOrderHistory)

export default router