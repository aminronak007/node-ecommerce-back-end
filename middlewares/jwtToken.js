const jwt = require("jsonwebtoken");

module.exports = {
  signAccessToken: (user) => {
    return new Promise((resolve, reject) => {
      const payload = { user };
      // console.log(payload);
      const options = {
        expiresIn: "1d",
      };
      jwt.sign(payload, process.env.JWT_SECRET, options, (err, token) => {
        if (err) reject(err);
        resolve(token);
      });
    });
  },
  verifyAccessToken: (req, res) => {
    if (!req.headers["authorization"])
      return res.json({ message: "Access Denied" });

    const authHeader = req.headers["authorization"];

    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) return res.json({ message: err });

      res.json({
        id: payload.user._id,
        name: payload.user.name,
        email: payload.user.email,
        mobile: payload.user.mobile,
      });
    });
  },
};
