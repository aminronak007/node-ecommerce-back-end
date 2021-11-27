const User = require("../models/user");
const Product = require("../models/product");
const Cart = require("../models/cart");
const Coupon = require("../models/coupons");
const Order = require("../models/order");
const uniqueid = require("uniqueid");

exports.userCart = async (req, res) => {
  //   console.log(req.body);
  const { cart } = req.body;

  let products = [];

  const user = await User.findOne({ email: req.body.currentUser.email }).lean();

  let cartExistByThisUser = await Cart.findOne({ orderedBy: user._id }).lean();

  if (cartExistByThisUser) {
    await Cart.deleteOne({ _id: cartExistByThisUser._id });
    // console.log("removed old cart");
  }

  for (let i = 0; i < cart.length; i++) {
    let object = {};
    object.product = cart[i]._id;
    object.count = cart[i].count;
    object.color = cart[i].color;

    let productFromDb = await Product.findById(cart[i]._id)
      .select("price")
      .lean();
    object.price = productFromDb.price;

    products.push(object);
  }

  //   console.log("product", products);
  let cartTotal = 0;

  for (let i = 0; i < products.length; i++) {
    cartTotal = cartTotal + products[i].price * products[i].count;
  }

  //   console.log("cartTotal", cartTotal);

  let newCart = await new Cart({
    products,
    cartTotal,
    orderedBy: user._id,
  }).save();

  //   console.log("-----", newCart);

  res.json({ ok: true });
};

exports.getUserCart = async (req, res) => {
  const { email } = await req.body.user;
  const user = await User.findOne({ email });

  let cart = await Cart.findOne({ orderedBy: user._id })
    .populate("products.product", "_id productName price totalAfterDiscount")
    .lean();

  const { products, cartTotal, totalAfterDiscount } = cart;

  res.json({ products, cartTotal, totalAfterDiscount });
};

exports.emptyCart = async (req, res) => {
  const { email } = req.body.user;
  const user = await User.findOne({ email }).lean();
  const cart = await Cart.findOneAndRemove({ orderedBy: user._id }).lean();

  res.json({ cart });
};

exports.saveAddress = async (req, res) => {
  const { email } = req.body.user;
  const address = req.body.address;

  const userAddress = await User.findOneAndUpdate(
    { email },
    { address }
  ).lean();

  res.json({ ok: true, userAddress });
};

exports.getUserAddress = async (req, res) => {
  const { email } = req.body.user;

  const userAddress = await User.findOne({ email }).lean();
  const { address } = userAddress;
  res.json({ address });
};

exports.applyCouponToUserCart = async (req, res) => {
  const { coupon } = req.body;
  const { email } = req.body.user;

  const validCoupon = await Coupon.findOne({ name: coupon }).lean();
  if (validCoupon === null) {
    res.json({ err: "Invalid Coupon" });
  }

  // console.log("VALID COUPON", validCoupon);
  const user = await User.findOne({ email }).lean();

  let { products, cartTotal } = await Cart.findOne({
    orderedBy: user._id,
  })
    .populate("products.product", "_id productName price")
    .lean();

  // console.log("ct", cartTotal, "disc", validCoupon.discount);

  // Calculate Total After Discount
  let totalAfterDiscount = (
    cartTotal -
    (cartTotal * validCoupon.discount) / 100
  ).toFixed(2);

  // console.log("------>", totalAfterDiscount);

  Cart.findOneAndUpdate(
    { orderedBy: user._id },
    { totalAfterDiscount },
    { new: true }
  ).exec();

  res.json({ totalAfterDiscount });
};

exports.createOrder = async (req, res) => {
  const { paymentIntent } = req.body.stripeResponse;

  const { email } = req.body.user;
  const user = await User.findOne({ email }).lean();

  let { products } = await Cart.findOne({ orderedBy: user._id }).lean();

  let newOrder = await new Order({
    products,
    paymentIntent,
    orderedBy: user._id,
  }).save();

  // Decrease Quantity, Increase Sold

  let bulkOption = products.map((item) => {
    return {
      updateOne: {
        filter: {
          _id: item.product._id,
        },
        update: {
          $inc: { quantity: -item.count, sold: +item.count },
        },
      },
    };
  });

  let updated = await Product.bulkWrite(bulkOption, { new: true });
  // console.log(updated);

  // console.log("New Order", newOrder);
  res.json({ ok: true });
};

exports.orders = async (req, res) => {
  // console.log(req.body);
  // return;
  let { email } = req.body.user;
  let user = await User.findOne({ email }).lean();
  let userOrders = "";
  if (user._id) {
    userOrders = await Order.find({ orderedBy: user._id })
      .populate("products.product")
      .lean();
  }

  // console.log(userOrders);

  res.json({ userOrders });
};

exports.addToWishlist = async (req, res) => {
  const { email } = req.body.user;
  const { productId } = req.body;

  const user = await User.findOneAndUpdate(
    { email },
    { $addToSet: { wishlist: productId } }
  ).exec();

  res.json({ ok: true });
};

exports.wishlist = async (req, res) => {
  const { email } = req.body.user;
  const wishlist = await User.findOne({ email })
    .select("wishlist")
    .populate("wishlist")
    .exec();

  res.json({ wishlist });
};

exports.removeFromWishlist = async (req, res) => {
  const { email } = req.body.user;
  const { productId } = req.params;
  const user = await User.findOneAndUpdate(
    { email },
    { $pull: { wishlist: productId } }
  ).exec();

  res.json({ ok: true });
};

exports.createCODOrder = async (req, res) => {
  const COD = req.body.COD;
  const couponApplied = req.body.couponApplied;

  if (!COD) return res.status(400).send("Create cash order failed");
  const { email } = req.body.user;
  const user = await User.findOne({ email }).lean();

  let userCart = await Cart.findOne({ orderedBy: user._id }).lean();

  let finalAmount = 0;

  if (couponApplied && userCart.totalAfterDiscount) {
    finalAmount = Math.round(userCart.totalAfterDiscount * 100);
  } else {
    finalAmount = Math.round(userCart.cartTotal * 100);
  }

  let newOrder = await new Order({
    products: userCart.products,
    paymentIntent: {
      id: uniqueid(),
      amount: finalAmount,
      currency: "inr",
      status: "Cash On Delivery",
      created: Date.now(),
      payment_method_types: ["cash"],
    },
    orderedBy: user._id,
    orderStatus: "Cash On Delivery",
  }).save();

  // Decrease Quantity, Increase Sold

  let bulkOption = userCart.products.map((item) => {
    return {
      updateOne: {
        filter: {
          _id: item.product._id,
        },
        update: {
          $inc: { quantity: -item.count, sold: +item.count },
        },
      },
    };
  });

  let updated = await Product.bulkWrite(bulkOption, { new: true });
  // console.log("PRODUCT QUANTITY-- AND SOLD++", updated);

  // console.log("NEW ORDER SAVED", newOrder);
  res.json({ ok: true });
};
