const cloudinary = require('cloudinary').v2;

const configured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Upload a data-URI / base64 image. Returns secure URL.
async function uploadImage(dataUri) {
  if (!configured) {
    const err = new Error('Cloudinary not configured');
    err.status = 503;
    throw err;
  }
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: 'prova/screenshots',
    resource_type: 'image',
  });
  return res.secure_url;
}

module.exports = { uploadImage, isConfigured: () => !!configured };
