const express = require("express");
const router = express.Router();
const {
  userCart,
  getUserCart,
  emptyCart,
  saveAddress,
  getUserAddress,
  applyCouponToUserCart,
  createOrder,
  orders,
  addToWishlist,
  wishlist,
  removeFromWishlist,
  createCODOrder,
} = require("../controllers/user");

router.post("/api/user/cart", userCart);
router.post("/api/user/cart-details", getUserCart);
router.put("/api/user/update/cart", emptyCart);
router.post("/api/user/address", saveAddress);
router.post("/api/user/address-details", getUserAddress);

router.post("/api/user/order", createOrder);
router.post("/api/orders", orders);

router.post("/api/user/cart/coupon", applyCouponToUserCart);

router.post("/api/user/add/wishlist", addToWishlist);
router.post("/api/user/wishlist", wishlist);
router.put("/api/user/wishlist/:productId", removeFromWishlist);
router.post("/api/user/cash-order", createCODOrder);

module.exports = router;
