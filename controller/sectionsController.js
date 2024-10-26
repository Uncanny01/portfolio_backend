import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js"
import { Section } from "../models/sectionsSchema.js"

export const GetSections = catchAsyncErrors(async (req, res, next) => {
  const sectionData = await Section.findOne({});
  res.status(200).json({
    success: true,
    sectionData
  })
})

export const UpdateSection = catchAsyncErrors(async (req, res, next) => {
  const { main, about, projects, skills, apps, timeline, contact, footer, darkMode } = req.body.data;
  const data = { main, about, projects, skills, apps, timeline, contact, footer, darkMode };
  const updatedData = await Section.findOneAndUpdate(
    {},
    { $set: data },
    { new: true, upsert: true });
  res.status(200).json({
    success: true,
    message: "Changes made successfully",
    updatedData
  })
})