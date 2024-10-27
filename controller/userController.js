import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/userSchema.js";
import { generateToken } from "../utils/jwtToken.js";
import { RESET_PASSWORD_EMAIL } from "../utils/emailMessageTemplate.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

export const register = catchAsyncErrors(async (req, res, next) => {

  const { email } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return next(new ErrorHandler("An account with this email already exists.", 409));

  if (!req.files || Object.keys(req.files).length === 0)
    return next(new ErrorHandler("Avatar and resume are required", 400));

  const { avatar, resume } = req.files;

  // console.log("AVATAR:", avatar);
  // console.log("RESUME:", resume);

  const cloudinaryAvatarResponse = await cloudinary.uploader.upload(
    avatar.tempFilePath,
    { folder: "AVATARS" }
  )

  if (!cloudinaryAvatarResponse || cloudinaryAvatarResponse.error) {
    console.error("Cloudinary error:", cloudinaryAvatarResponse.error || "Unknown")
  }

  const cloudinaryResumeResponse = await cloudinary.uploader.upload(
    resume.tempFilePath,
    { folder: "MY_RESUME" }
  )

  if (!cloudinaryResumeResponse || cloudinaryResumeResponse.error) {
    console.error("Cloudinary error:", cloudinaryResumeResponse.error || "Unknown")
  }

  const { fullname, phone, aboutMe, password, portfolioUrl, githubUrl, instaUrl, linkedInUrl, twitterUrl } = req.body;

  const user = new User({
    fullname, email, phone, aboutMe, password, portfolioUrl, githubUrl, instaUrl, linkedInUrl, twitterUrl,
    avatar: {
      public_id: cloudinaryAvatarResponse.public_id,
      url: cloudinaryAvatarResponse.secure_url
    },
    resume: {
      public_id: cloudinaryResumeResponse.public_id,
      url: cloudinaryResumeResponse.secure_url
    }
  });

  await user.save();

  generateToken(user, "User Registered", 201, res);

})

export const login = catchAsyncErrors(async (req, res, next) => {

  const { email, password } = req.body;
  if (!email || !password) return next(new ErrorHandler("Email and password are required!"));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler("Invalid email or password!"));

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) return next(new ErrorHandler("Invalid email or password!"));

  generateToken(user, "Logged In", 200, res);

})

export const logout = catchAsyncErrors(async (req, res, next) => {
  res.status(200).cookie("token", "", {
    expires: new Date(Date.now()),
    secure: true,
    httpOnly: true,
    sameSite: 'None'
  }).json({
    success: true,
    message: "Logged Out"
  })
})

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  })
})

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { fullname, email, phone, aboutMe, password, portfolioUrl, githubUrl, instaUrl, linkedInUrl, twitterUrl } = req.body;
  const newUserData = { fullname, email, phone, aboutMe, password, portfolioUrl, githubUrl, instaUrl, linkedInUrl, twitterUrl };
  if (req.files && req.files.avatar) {
    const { avatar } = req.files;
    const user = await User.findById(req.user.id);
    await cloudinary.uploader.destroy(user.avatar.public_id);
    const cloudinaryResponse = await cloudinary.uploader.upload(
      avatar.tempFilePath,
      { folder: "AVATAR" }
    );
    newUserData.avatar = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    }
  }
  if (req.files && req.files.resume) {
    const { resume } = req.files;
    const user = await User.findById(req.user.id);
    await cloudinary.uploader.destroy(user.resume.public_id);
    const cloudinaryResponse = await cloudinary.uploader.upload(
      resume.tempFilePath,
      { folder: "MY_RESUME" }
    );
    newUserData.resume = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    }
  }
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });

  res.status(200).json({
    success: true,
    message: "Profile updated",
    user
  })

})

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) return next(new ErrorHandler("Please fill all fields.", 400));
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(currentPassword);
  if (!isPasswordMatched) return next(new ErrorHandler("Invalid current password", 404));
  if (newPassword !== confirmPassword) return next(new ErrorHandler("New password and cofirm password fields do not match.", 400));
  user.password = newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password updated",
  })
})

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  if(!email) return next(new ErrorHandler("Please enter your email.", 400));
  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("No account with this email exists.", 404));
  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.PORTFOLIO_URL}/myProfile/resetPassword/${resetToken}`;
  const message = RESET_PASSWORD_EMAIL.replace("<resetURL>", resetPasswordUrl);

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset Portfolio Password",
      message
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`
    })
  }
  catch (e) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();
    return next(new ErrorHandler(e.message, 500));
  }
})

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto.createHash("md5").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpires: { $gt: Date.now() }
  });
  if (!user) return next(new ErrorHandler("Expired or Invalid URL.", 401));

  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) return next(new ErrorHandler("Password fields do not match.", 401));

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpires = undefined;
  
  await user.save();
  
  generateToken(user, "Password changed successfully.", 200, res);
  
})

export const getPortfolio = catchAsyncErrors(async (req, res, next) => {
  const id = "66f1069bd52fb89f1508dbdd";
  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("User no longer existed.", 404));
  res.status(200).json({
    success: true,
    user
  })
})