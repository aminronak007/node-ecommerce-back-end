const cloudinary = require("cloudinary").v2;

// Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.upload = async (req, res) => {
  let catName = req.body.cat;
  let subName = req.body.sub;
  let productName = req.body.productName;

  let result = await cloudinary.uploader.upload(req.body.image, {
    folder: `${catName}/${subName}/${productName}`,

    public_id: `${Date.now()}`,
    resource_type: "auto",
  });

  res.json({
    public_id: result.public_id,
    url: result.secure_url,
  });
};
exports.remove = (req, res) => {
  let image_id = req.body.public_id;

  cloudinary.uploader.destroy(image_id, (err, result) => {
    if (err) return res.json({ success: false, err });
    res.json({ result });
  });
};
