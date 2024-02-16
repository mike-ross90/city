import multer from "multer"
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "Uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  
  //File Filter
  
  const fileFilterDoc = function (req, file, cb) {
      const allowedTypes = ["application/msword", "application/pdf", "text/plain"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only document and text files are allowed"));
      }
    };
    
  
  
  const uploadDoc = multer({ storage: storage, fileFilter: fileFilterDoc });
  

 

  export default {
    uploadDoc
  };
  
  //export default UploadFilter;
  