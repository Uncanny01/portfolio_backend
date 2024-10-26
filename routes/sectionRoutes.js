import express from "express"
import { GetSections, UpdateSection } from "../controller/sectionsController.js";

const router = express.Router();

router.get("/get", GetSections);
router.put("/update", UpdateSection);

export default router;