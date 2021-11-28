const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../middlewares/jwtToken");
const nodemailer = require("nodemailer");

router.get("/", verifyAccessToken);

router.post("/api/register", async (req, res) => {
  const { fname, email, mobile, password, cpassword } = req.body;

  if (
    !fname ||
    !email ||
    !mobile ||
    mobile.length < 10 ||
    mobile.length > 10 ||
    !password ||
    !password.length > 6 ||
    !cpassword
  )
    return res.json({ error: "Please provide Valid Details !!!" });

  const userEmail = await User.findOne({ email }).lean(); // Finding Email

  if (userEmail) return res.json({ error: "Email already exists !!!" }); // Checking Email Exits or Not

  const userMobile = await User.findOne({ mobile }).lean();

  if (userMobile)
    return res.json({ error: "Mobile number already exists !!!" });

  if (cpassword !== password)
    return res.json({ error: "Password does not matches !!!" });

  const hash = await bcrypt.hash(password, 10); // Hasing Password

  const newUser = await User.create({
    name: fname,
    email: email,
    mobile: mobile,
    password: hash,
  }); // Creating New User

  await newUser.save((error) => {
    if (error) {
      res.json({ error });
    } else {
      res.json({
        success: "Your Account has created Successfully. Please Sign In !!!",
      });
    }
  });
});

router.post("/api/login", async (req, res) => {
  const { email, password } = await req.body;

  if (!email || !password)
    return res.json({ error: "Please Provide valid details !!!" });

  const user = await User.findOne({ email }).lean(); // Finding Email

  if (!user)
    return res.json({ error: "Email does not exists. Please Sign Up !!!" }); // Checking Email

  const pass = await bcrypt.compare(password, user.password); // Comparing Password

  if (!pass) return res.json({ error: "Email Id or Password is Wrong !!!" }); // Checkinmg password

  const accessToken = await signAccessToken(user);

  res.cookie("accessToken", accessToken, {
    // expires: new Date(Date.now() + 3600000), // 1 hour
    maxAge: 24 * 60 * 60 * 1000, //  1 Day
    // httpOnly: true,
    secure: true,
    sameSite: true,
  });

  res.json({ success: "Logged in Successfully !!!", accessToken });
});

router.post("/api/forgotpassword", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.find({ email }).lean();
    const id = user[0]._id.toString();

    const text = `http://localhost:5000/resetpassword/${id}`;

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "suryarathod315@gmail.com",
        pass: "Suryarathod@315",
      },
    });

    let mailOptions = {
      from: "suryarathod315@gmail.com",
      to: email,
      subject: "Sending Email using Node.js",
      html: text,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        res.json({ success: "Reset Password link sent succcessfully " });
      }
    });
  } catch (err) {
    res.status(400).json({ error: "Forgot Password failed." });
  }
});

router.post("/api/resetpassword/:id", async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword)
      return res.json({ error: "Password does not Matched !" });

    if (newPassword.length < 6)
      return res.json({ error: "Password must be 6 characters long !" });

    const hash = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { password: hash }
    );

    if (user) {
      res.json({ success: "Password has been updated successfully" });
    } else {
      res.json({ error: "Password Reset Failed" });
    }
  } catch (err) {
    res.status(400).json({ error: "Reset Password failed." });
  }
});

module.exports = router;
