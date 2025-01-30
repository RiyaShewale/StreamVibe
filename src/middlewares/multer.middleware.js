import multer from 'multer'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)// better would be if we use unique file name by generating a unique suffix and  appending it to our file name
    }
  })
  
  export const upload = multer({ storage })