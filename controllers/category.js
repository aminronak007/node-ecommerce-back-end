const Category = require("../models/category");
const SubCategory = require("../models/subCategory");
const slugify = require("slugify");
const Product = require("../models/product");

exports.createCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName)
      return res.json({ error: "Please provide valid Category Name." });

    const CategoryName = await Category.findOne({ categoryName }).lean();

    if (CategoryName)
      return res.json({ error: "Category Name already exists !!!" });
    res.json(
      await new Category({
        categoryName,
        slug: slugify(categoryName),
      }).save()
    );
  } catch (err) {
    // console.log(err);
    res.status(400).json({ error: "Create Category failed." });
  }
};

exports.listCategory = async (req, res) => {
  res.json(await Category.find({}).sort({ createdAt: -1 }).lean());
};

exports.readCategory = async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).lean();
  const products = await Product.find({ category }).populate("category").lean();
  res.json({ category, products });
};

exports.updateCategory = async (req, res) => {
  const { categoryName } = req.body;
  try {
    const updateCategory = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      { categoryName, slug: slugify(categoryName) },
      { new: true }
    );
    res.json({ updateCategory, success: "Category updated successfully" });
  } catch (err) {
    res.status(400).json({ error: "Update Category failed." });
  }
};

exports.removeCategory = async (req, res) => {
  try {
    const deleteCategory = await Category.findOneAndDelete({
      slug: req.params.slug,
    });

    res.json({ success: "Category deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Delete Category failed." });
  }
};

exports.getSubCategories = async (req, res) => {
  SubCategory.find({ parent: req.params._id }).exec((err, subCategory) => {
    if (err) return console.log(err);
    return res.json({ subCategory });
  });
};
