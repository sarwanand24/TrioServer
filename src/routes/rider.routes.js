import { Router } from "express";
import {
    addToCyrMedicoRideHistory,
    addToCyrRideHistory,
    addToFoodyRideHistory,
    changeCurrentPassword, earning, fetchAcceptReject, getCurrentRider, getEarnings, getEarningsHistory, getFoodyRideHistory, loginRider, 
    logoutRider, peakOrderZones, refreshAccessToken, registerRider,
    removeFromCyrMedicoRideHistory,
    removeFromCyrRideHistory,
    removeFromFoodyRideHistory,
    setDeviceToken,
    signoutRider,
    toggleAvailableStatus,
    updateAccountDetails, updateDrivingLiscence, updateRiderLocation, updateRiderProfilePhoto
}
    from "../controllers/rider.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyRidersJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "profilePhoto",
            maxCount: 1
        },
        {
            name: "drivingLiscence",
            maxCount: 1
        },
        {
            name: "aadharCard",
            maxCount: 1
        }
    ]), 
    registerRider)

router.route("/login").post(loginRider)

//secured Routes

router.route("/logout").post(verifyRidersJWT, logoutRider)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/password-change").post(verifyRidersJWT, changeCurrentPassword)

router.route("/current-rider").get(verifyRidersJWT, getCurrentRider)

router.route("/update-account-details").patch(verifyRidersJWT, updateAccountDetails)

router.route("/update-profile-photo").patch(verifyRidersJWT, upload.single("profilePhoto"), updateRiderProfilePhoto)

router.route("/signout").delete(verifyRidersJWT, signoutRider)

router.route("/updateDrivingLiscence").patch(verifyRidersJWT, upload.single("drivingLiscence"), updateDrivingLiscence)

router.route("addCyrRideHistory/:orderId").post(verifyRidersJWT, addToCyrRideHistory)

router.route("addFoodyRideHistory/:orderId").post(verifyRidersJWT, addToFoodyRideHistory)

router.route("addCyrMedicoRideHistory/:orderId").post(verifyRidersJWT, addToCyrMedicoRideHistory)

router.route("removeCyrRideHistory/:orderId").post(verifyRidersJWT, removeFromCyrRideHistory)

router.route("removeFoodyRideHistory/:orderId").post(verifyRidersJWT, removeFromFoodyRideHistory)

router.route("removeCyrMedicoRideHistory/:orderId").post(verifyRidersJWT, removeFromCyrMedicoRideHistory)

router.route("toggleAvailableStatus").get(verifyRidersJWT, toggleAvailableStatus)

router.route("/set-device-token").post(verifyRidersJWT, setDeviceToken);

router.route("/fetchAccept-Reject").get(verifyRidersJWT, fetchAcceptReject);

router.route("/update-rider-location").post(verifyRidersJWT, updateRiderLocation);

router.route("/calculateEarning").post(earning);

router.route("/foody-order-history").get(verifyRidersJWT, getFoodyRideHistory);

router.route("/toggle-availability").post(verifyRidersJWT, toggleAvailableStatus);

router.route("/get-earnings").get(getEarnings);

router.route("/earning-history").get(getEarningsHistory);

router.route('/getPeakOrderZones/:city').get(peakOrderZones);

export default router