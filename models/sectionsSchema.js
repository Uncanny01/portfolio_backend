import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  main: Boolean,
  about: Boolean,
  projects: Boolean,
  skills: Boolean,
  apps: Boolean,
  timeline: Boolean,
  contact: Boolean,
  footer: Boolean,
  darkMode: Boolean
})

export const Section = mongoose.model("Section", sectionSchema);