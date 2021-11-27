const mongoose = require("mongoose");
require("dotenv").config();

const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      autoIndex: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log("Connected to Database");
    })
    .catch((error) => {
      console.log("Something went Wrong !", error);
    });
};

module.exports = dbConnection;
