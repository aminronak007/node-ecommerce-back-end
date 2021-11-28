const Product = require("../models/product");
const Category = require("../models/category");
const subCategory = require("../models/subCategory");
const User = require("../models/user");
const slugify = require("slugify");

exports.createProducts = async (req, res) => {
  try {
    req.body.slug = slugify(req.body.productName);
    const newProduct = await new Product(req.body).save();
    res.json(newProduct);
  } catch (err) {
    res.status(400).json({ error: "Create Product failed." });
  }
};

exports.listProducts = async (req, res) => {
  res.json(
    await Product.find({})
      .limit(parseInt(req.params.count))
      .populate("category")
      .populate("subCategory")
      .sort([["createdAt", "desc"]])
      .exec()
  );
};

exports.readProducts = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category")
    .populate("subCategory")
    .lean();

  res.json({ product });
};

exports.updateProducts = async (req, res) => {
  try {
    if (req.body.productName) {
      req.body.slug = slugify(req.body.productName);
    }
    const updated = await Product.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true }
    );

    res.json({ updated, success: "Product updated successfully" });
  } catch (err) {
    res.status(400).json({ error: "Update Product failed." });
  }
};

exports.removeProducts = async (req, res) => {
  try {
    const deleteProduct = await Product.findOneAndDelete({
      slug: req.params.slug,
    });

    res.json({ success: "Product deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Delete Product failed." });
  }
};

exports.getCategoryName = async (req, res) => {
  try {
    const id = req.body.category;

    const categoryName = await Category.find({ _id: id });
    const catName = categoryName.map((item) => {
      return item.categoryName;
    });
    res.send(catName[0]);
  } catch (err) {
    res.status(400).json({ error: "Find Category Name failed." });
  }
};

exports.getSubCategoryName = async (req, res) => {
  try {
    const id = req.body.subCategory;

    const subCategoryName = await subCategory.find({ _id: id });

    const subName = subCategoryName.map((item, i) => {
      return item.subCategoryName;
    });

    const sub = subName.map((item) => {
      return item;
    });

    res.send(sub[0]);
  } catch (err) {
    res.status(400).json({ error: "Find Sub Category Name failed." });
  }
};

// Without Pagination
// exports.list = async (req, res) => {
//   try {
//     // CreatedAt & UpdatedAt, Descending/Ascending
//     const { sort, order, limit } = req.body;

//     const products = await Product.find({})
//       .populate("category")
//       .populate("subCategory")
//       .sort([[sort, order]])
//       .limit(limit)
//       .lean();

//     res.json({ products });
//   } catch (err) {
//     console.log(err);
//   }
// };

// With Pagination
exports.list = async (req, res) => {
  try {
    // CreatedAt & UpdatedAt, Descending/Ascending
    const { sort, order, page } = req.body;
    const currentPage = page || 1;
    const perPage = 3;

    const products = await Product.find({})
      .skip((currentPage - 1) * perPage)
      .populate("category")
      .populate("subCategory")
      .sort([[sort, order]])
      .limit(perPage)
      .lean();

    res.json({ products });
  } catch (err) {
    console.log(err);
  }
};

exports.productsCount = async (req, res) => {
  let total = await Product.find({}).estimatedDocumentCount();
  res.json({ total });
};

exports.productRating = async (req, res) => {
  const { star, userEmail } = req.body;
  const product = await Product.findById(req.params.productId);
  const user = await User.findOne({ email: userEmail });

  let existingRatingsObject = product.ratings.find(
    (element) => element.postedBy.toString() === user._id.toString()
  );

  if (existingRatingsObject === undefined) {
    let ratingAdded = await Product.findByIdAndUpdate(
      product._id,
      {
        $push: { ratings: { star, postedBy: user._id } },
      },
      { new: true }
    );
    // console.log("ratingAdded", ratingAdded);
    res.json({ success: "Ratings added Successfully." });
  } else {
    const ratingUpdated = await Product.updateOne(
      {
        ratings: { $elemMatch: existingRatingsObject },
      },
      { $set: { "ratings.$.star": star } },
      { new: true }
    );

    res.json({ success: "Ratings updated Successfully." });
  }
};

exports.relatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).lean();

    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
    })
      .limit(3)
      .populate("category")
      .populate("subCategory")
      .populate("postedBy", "-password")
      .lean();

    res.json({ related });
  } catch (err) {
    console.log(err);
  }
};

// SERACH / FILTER

const handleQuery = async (req, res, query) => {
  const products = await Product.find({ $text: { $search: query } })
    .populate("category", "_id productName")
    .populate("subCategory", "_id productName")
    .populate("postedBy", "_id productName")
    .exec();

  res.json(products);
};

const handlePrice = async (req, res, price) => {
  try {
    let products = await Product.find({
      price: {
        $gte: price[0],
        $lte: price[1],
      },
    })
      .populate("category", "_id productName")
      .populate("subCategory", "_id productName")
      .populate("postedBy", "_id productName")
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleCategory = async (req, res, category) => {
  try {
    let products = await Product.find({ category })
      .populate("category", "_id productName")
      .populate("subCategory", "_id productName")
      .populate("postedBy", "_id productName")
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleStar = (req, res, stars) => {
  Product.aggregate([
    {
      $project: {
        document: "$$ROOT",
        // title: "$title",
        floorAverage: {
          $floor: { $avg: "$ratings.star" }, // floor value of 3.33 will be 3
        },
      },
    },
    { $match: { floorAverage: stars } },
  ])
    .limit(12)
    .exec((err, aggregates) => {
      if (err) console.log("AGGREGATE ERROR", err);
      Product.find({ _id: aggregates })
        .populate("category", "_id productName")
        .populate("subCategory", "_id productName")
        .populate("postedBy", "_id productName")
        .exec((err, products) => {
          if (err) console.log("PRODUCT AGGREGATE ERROR", err);
          res.json(products);
        });
    });
};

const handleSub = async (req, res, sub) => {
  const products = await Product.find({ subCategory: sub })
    .populate("category", "_id productName")
    .populate("subCategory", "_id productName")
    .populate("postedBy", "_id productName")
    .exec();

  res.json(products);
};

const handleShipping = async (req, res, shipping) => {
  const products = await Product.find({ shipping })
    .populate("category", "_id productName")
    .populate("subCategory", "_id productName")
    .populate("postedBy", "_id productName")
    .exec();

  res.json(products);
};

const handleColor = async (req, res, color) => {
  const products = await Product.find({ color })
    .populate("category", "_id productName")
    .populate("subCategory", "_id productName")
    .populate("postedBy", "_id productName")
    .exec();

  res.json(products);
};

const handleBrand = async (req, res, brand) => {
  const products = await Product.find({ brand })
    .populate("category", "_id productName")
    .populate("subCategory", "_id productName")
    .populate("postedBy", "_id productName")
    .exec();

  res.json(products);
};

exports.searchFilters = async (req, res) => {
  // console.log(req.body);
  const { query, price, category, stars, sub, shipping, color, brand } =
    req.body;

  if (query) {
    // console.log("query --->", query);
    await handleQuery(req, res, query);
  }

  // price [20, 200]
  if (price !== undefined) {
    // console.log("price ---> ", price);
    await handlePrice(req, res, price);
  }

  if (category) {
    // console.log("category ---> ", category);
    await handleCategory(req, res, category);
  }

  if (stars) {
    // console.log("stars ---> ", stars);
    await handleStar(req, res, stars);
  }

  if (sub) {
    // console.log("sub ---> ", sub);
    await handleSub(req, res, sub);
  }

  if (shipping) {
    // console.log("shipping ---> ", shipping);
    await handleShipping(req, res, shipping);
  }

  if (color) {
    // console.log("color ---> ", color);
    await handleColor(req, res, color);
  }

  if (brand) {
    // console.log("brand ---> ", brand);
    await handleBrand(req, res, brand);
  }
};
