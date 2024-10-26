import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { getUser, getPortfolio, login, logout, register, updatePassword, updateProfile, forgotPassword, resetPassword } from "../controller/userController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);

router.get("/myProfile", isAuthenticated, getUser);
router.put("/myProfile/updateProfile", isAuthenticated, updateProfile);
router.put("/myProfile/updatePassword", isAuthenticated, updatePassword);
router.post("/myProfile/forgotPassword", forgotPassword);
router.put("/myProfile/resetPassword/:token", resetPassword);

router.get("/myPortfolio", getPortfolio);

export default router;