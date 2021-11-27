const Order = require("../models/order");

exports.orders = async (req, res) => {
  let orders = await Order.find({})
    .sort("-createdAt")
    .populate("products.product")
    .lean();

  res.json({ orders });
};

exports.orderStatus = async (req, res) => {
  const { orderId, orderStatus } = req.body;

  let updated = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus },
    { new: true }
  ).lean();

  res.json({ updated });
};
