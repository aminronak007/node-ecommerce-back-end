const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const subCategorySchema = mongoose.Schema(
  {
    subCategoryName: {
      type: String,
      trim: true,
      required: "Sub Category Name is required",
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    parent: { type: ObjectId, ref: "Categories", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubCategories", subCategorySchema);
