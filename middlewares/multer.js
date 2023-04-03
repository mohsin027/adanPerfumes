
import multer from "multer";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        let ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
        cb(null, file.fieldname + '-' + uniqueSuffix+ext)
      }
}); 
  
var upload = multer({ storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // limit file size to 1MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('File type not allowed. Only images are allowed.'));
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif','image/webp','image/jpg','image/svg'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('File type not allowed. Only JPEG, PNG, webp and GIF images are allowed.'));
        }
    
        cb(null, true);
      }
 });

export default upload