const Coupon = require("../models/coupons");

exports.create = async (req, res) => {
  try {
    const { name, expiry, discount } = req.body.coupon;

    res.json(await new Coupon({ name, expiry, discount }).save());
  } catch (err) {
    console.log(err);
  }
};
exports.list = async (req, res) => {
  try {
    res.json(await Coupon.find({}).sort({ createdAt: -1 }).lean());
  } catch (err) {
    console.log(err);
  }
};
exports.remove = async (req, res) => {
  try {
    res.json(await Coupon.findByIdAndDelete(req.params.couponId));
  } catch (err) {
    console.log(err);
  }
};
