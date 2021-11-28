const router = require("express").Router();
const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../middlewares/jwtToken");

const {
  createCategory,
  readCategory,
  updateCategory,
  removeCategory,
  listCategory,
  getSubCategories,
} = require("../controllers/category");

const {
  createSubCategory,
  readSubCategory,
  updateSubCategory,
  removeSubCategory,
  listSubCategory,
} = require("../controllers/subCategory");
router.get("/api/admin", verifyAccessToken, (req, res) => {});

const {
  createProducts,
  readProducts,
  updateProducts,
  removeProducts,
  listProducts,
  getCategoryName,
  getSubCategoryName,
  list,
  productsCount,
  productRating,
  relatedProducts,
  searchFilters,
} = require("../controllers/product");

const { upload, remove } = require("../controllers/cloudinary");

const { orders, orderStatus } = require("../controllers/admin");

router.get("/api/admin", verifyAccessToken, (req, res) => {});

router.post("/api/admin", async (req, res) => {
  const { fname, email, password } = req.body;

  if (!fname || !email || !password || password.length < 6)
    return res.json({ error: "Please provide Valid Details !!!" });

  const adminEmail = await Admin.findOne({ email }).lean(); // Finding Email

  if (adminEmail) return res.json({ error: "Email already exists !!!" }); // Checking Email Exits or Not

  const hash = await bcrypt.hash(password, 10); // Hasing Password

  const newAdmin = await Admin.create({
    name: fname,
    email: email,
    password: hash,
  }); // Creating New User

  await newAdmin.save((error) => {
    if (error) {
      res.json({ error });
    } else {
      res.json({
        success: "Admin has been Created !!!",
      });
    }
  });
});

router.post("/api/admin/login", async (req, res) => {
  const { email, password } = await req.body;

  if (!email || !password)
    return res.json({ error: "Please Provide valid details !!!" });

  const admin = await Admin.findOne({ email }).lean(); // Finding Email

  if (!admin) return res.json({ error: "Email does not exists !!!" }); // Checking Email

  const pass = await bcrypt.compare(password, admin.password); // Comparing Password

  if (!pass) return res.json({ error: "Email or Password id Wrong !!!" }); // Checkinmg password

  const accessToken = await signAccessToken(admin);

  res.cookie("adminToken", accessToken, {
    // expires: new Date(Date.now() + 3600000), // 1 hour
    maxAge: 36000000, //  1 Day
    // httpOnly: true,
    secure: true,
    sameSite: true,
  });

  res.json({ success: "Admin Logged in Successfully !!!", accessToken });
});

// Categories
router.post("/api/category", createCategory);
router.get("/api/categories", listCategory);
router.get("/api/category/:slug", readCategory);
router.put("/api/category/:slug", updateCategory);
router.delete("/api/category/:slug", removeCategory);

// SubCategories
router.post("/api/subCategory", createSubCategory);
router.get("/api/subCategories", listSubCategory);
router.get("/api/subCategory/:slug", readSubCategory);
router.put("/api/subCategory/:slug", updateSubCategory);
router.delete("/api/subCategory/:slug", removeSubCategory);
router.get("/api/category/subCategories/:_id", getSubCategories);

// Products

router.post("/api/products/total", productsCount);
router.post("/api/product", createProducts);
router.get("/api/products/:count", listProducts);
router.get("/api/product/:slug", readProducts);
router.put("/api/product/:slug", updateProducts);
router.delete("/api/product/:slug", removeProducts);
router.post("/api/categoryname", getCategoryName);
router.post("/api/subcategoryname", getSubCategoryName);
router.post("/api/products", list);
router.put("/api/product/star/:productId", productRating);
router.get("/api/product/related/:productId", relatedProducts);
router.post("/api/search/filters", searchFilters);

// Cloudinary
router.post("/api/uploadimages", upload);
router.post("/api/removeimage", remove);

// routes
router.get("/api/admin/orders", orders);
router.put("/api/admin/order-status", orderStatus);

module.exports = router;
