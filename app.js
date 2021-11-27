const express = require("express");
const app = express();
const dbConnect = require("./config/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");

dbConnect();
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({ credentials: true, origin: "http://localhost:5000" }));

const auth = require("./routes/auth");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/user");
const couponRoute = require("./routes/couponRoutes");
const stripeRoute = require("./routes/stripe");

app.use("/", auth);
app.use("/api/register", auth);
app.use("/api/login", auth);
app.use("/api/signout", auth);

//Admin
app.use("/", adminRoute);
app.use("/api/admin", adminRoute);
app.use("/api/admin/dashboard", adminRoute);
app.use("/api/admin/login", adminRoute);

// Categories
app.use("/api/category", adminRoute);
app.use("/api/categories", adminRoute);
app.use("/api/category/:slug", adminRoute);

//Products
app.use("/api/product", adminRoute);
app.use("/api/products/:count", adminRoute);
app.use("/api/product/:slug", adminRoute);

// User
app.use("/", userRoute);
app.use("/", couponRoute);
app.use("/", stripeRoute);

app.listen(3000, () => {
  console.log("Server Started on port 3000");
});
