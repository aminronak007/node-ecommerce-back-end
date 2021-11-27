const express = require("express");
const router = express.Router();

const { createPaymentIntent } = require("../controllers/stripe");

router.post("/api/create-payment-intent", createPaymentIntent);

module.exports = router;
