const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    const folder = process.env.CLOUDINARY_FOLDER || 'sh-mexico';
    const resourceType = mimetype.startsWith('video/') ? 'video' : mimetype === 'application/pdf' ? 'raw' : 'image';

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${filename.replace(/\s/g, '_')}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(buffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Error al eliminar de Cloudinary:', err);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
