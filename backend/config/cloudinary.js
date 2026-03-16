const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'kronik/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
    },
});

const documentStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: 'kronik/documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        resource_type: file.mimetype === 'application/pdf' ||
            file.mimetype.includes('word') ? 'raw' : 'image',
    }),
});

module.exports = { cloudinary, profileStorage, documentStorage };
