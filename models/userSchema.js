import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = mongoose.Schema({
  fullname: {
    type: String,
    required: [true, "Full name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"]
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"]
  },
  aboutMe: {
    type: String,
    required: [true, "About me section is required"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: [8, "Password must contain 8 chars."],
    select: false
  },
  avatar: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  resume: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  portfolioUrl: {
    type: String,
    required: [true, "Portfolio url is required"]
  },
  githubUrl: String,
  instaUrl: String,
  linkedInUrl: String,
  twitterUrl: String,
  resetPasswordToken: String,
  resetPasswordTokenExpires: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (userPassword) {
  return bcrypt.compare(userPassword, this.password);
};

userSchema.methods.generateJwt = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES
  });
};

userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(10).toString("hex");
  this.resetPasswordToken = crypto.createHash("md5").update(resetToken).digest("hex");
  this.resetPasswordTokenExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
}

export const User = mongoose.model("User", userSchema);