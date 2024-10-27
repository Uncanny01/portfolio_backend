export const generateToken = (user, message, statusCode, res) => {
  const token = user.generateJwt();
  res.status(statusCode).cookie("token", token, {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    secure: true,
    httpOnly: true,
    sameSite: 'None'
  }).json({
    success: true,
    message,
    token,
    user
  });
}