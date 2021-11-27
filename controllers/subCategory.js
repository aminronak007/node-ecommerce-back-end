const SubCategory = require("../models/subCategory");
const Product = require("../models/product");
const slugify = require("slugify");

exports.createSubCategory = async (req, res) => {
  try {
    const { subCategoryName, parent } = req.body;

    if (!subCategoryName)
      return res.json({ error: "Please provide valid Category Name." });

    const SubCategoryName = await SubCategory.findOne({
      subCategoryName,
    }).lean();

    if (SubCategoryName)
      return res.json({ error: "Sub Category Name already exists !!!" });
    res.json(
      await new SubCategory({
        subCategoryName,
        parent,
        slug: slugify(subCategoryName),
      }).save()
    );
  } catch (err) {
    // console.log(err);
    res.status(400).json({ error: "Create Sub Category failed." });
  }
};

exports.listSubCategory = async (req, res) => {
  res.json(
    await SubCategory.find({}).sort({ createdAt: -1 }).populate("parent").lean()
  );
};

exports.readSubCategory = async (req, res) => {
  const subCategory = await SubCategory.findOne({
    slug: req.params.slug,
  }).lean();
  const products = await Product.find({ subCategory })
    .populate("category")
    .lean();
  res.json({ subCategory, products });
};

exports.updateSubCategory = async (req, res) => {
  const { subCategoryName, parent } = req.body;
  try {
    const updateSubCategory = await SubCategory.findOneAndUpdate(
      { slug: req.params.slug },
      { subCategoryName, parent, slug: slugify(subCategoryName) },
      { new: true }
    );
    res.json({
      updateSubCategory,
      success: "Sub Category updated successfully",
    });
  } catch (err) {
    res.status(400).json({ error: "Update Sub Category failed." });
  }
};

exports.removeSubCategory = async (req, res) => {
  try {
    const deleteSubCategory = await SubCategory.findOneAndDelete({
      slug: req.params.slug,
    });

    res.json({ success: "Sub Category deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Delete Sub Category failed." });
  }
};
