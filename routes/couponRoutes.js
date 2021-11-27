const express = require("express");
const router = express.Router();
const { create, remove, list } = require("../controllers/coupon");

router.post("/api/coupon", create);
router.get("/api/coupon-details", list);
router.delete("/api/delete/coupon/:couponId", remove);

module.exports = router;
