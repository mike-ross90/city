import multer from "multer"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//File Filters





const FilterImages = function (req, file, cb) {
  console.log(file)
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
    "text/plain",
    "application/vnd.oasis.opendocument.text",
    "image/jpeg",
    "image/jpg",
    "image/png"
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only document and text files are allowed"));
  }
};











  










const uploadListing = multer({ storage: storage, fileFilter: FilterImages });


const UploadFilter = {
  uploadListing,

};

export default UploadFilter;
