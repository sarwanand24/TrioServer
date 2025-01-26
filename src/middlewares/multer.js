import multer from "multer";

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const memoryStorage = multer.memoryStorage();

//Export Disk Storage
export const upload = multer(
  {
    storage: diskStorage,
    limits: {
      fieldSize: 10 * 1024 * 1024, // 10 MB field size limit
    }
  })

// Export Memory Storage Upload
export const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fieldSize: 10 * 1024 * 1024, // 10 MB field size limit
  }
});