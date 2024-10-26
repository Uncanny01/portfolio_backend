import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/projectSchema.js";
import { v2 as cloudinary } from "cloudinary";

export const addNewProject = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Project Banner is required!", 404));
  }
  const { projectBanner } = req.files;
  const { title, description, gitRepoLink, projectLink, stack, technologies, deployed, } = req.body;
  if (!title || !description || !gitRepoLink || !projectLink || !stack || !technologies || !deployed) {
    return next(new ErrorHandler("Please provide all details!", 400));
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(
    projectBanner.tempFilePath,
    { folder: "PROJECTS" }
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponse.error || "Unknown cloudinary error"
    );
    return next(new ErrorHandler("Failed to upload avatar to Cloudinary", 500));
  }
  const project = new Project({
    title, description, gitRepoLink, projectLink, stack, technologies, deployed,
    projectBanner: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  await project.save();
  res.status(201).json({
    success: true,
    message: "New project added!",
    project,
  });
});

export const updateProject = catchAsyncErrors(async (req, res, next) => {
  const { title, description, stack, technologies, deployed, projectLink, gitRepoLink } = req.body;
  const newProjectData = { title, description, stack, technologies, deployed, projectLink, gitRepoLink };
  if (req.files && req.files.projectBanner) {
    const projectBanner = req.files.projectBanner;
    const project = await Project.findById(req.params.id);
    const projectImageId = project.projectBanner.public_id;
    await cloudinary.uploader.destroy(projectImageId);
    const newProjectImage = await cloudinary.uploader.upload(
      projectBanner.tempFilePath,
      {
        folder: "PROJECTS",
      }
    );
    newProjectData.projectBanner = {
      public_id: newProjectImage.public_id,
      url: newProjectImage.secure_url,
    };
  }
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    newProjectData,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    message: "Project updated!",
    project,
  });
});

export const deleteProject = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    return next(new ErrorHandler("Already deleted!", 404));
  }
  const projectImageId = project.projectBanner.public_id;
  await cloudinary.uploader.destroy(projectImageId);
  await project.deleteOne();
  res.status(200).json({
    success: true,
    message: "Project deleted!",
  });
});

export const getAllProjects = catchAsyncErrors(async (req, res, next) => {
  const projects = await Project.find();
  res.status(200).json({
    success: true,
    projects,
  });
});

export const getSingleProject = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id);
    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(400).json({
      error,
    });
  }
});