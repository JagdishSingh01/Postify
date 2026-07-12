const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// diskstorage
const storage = multer.diskStorage({
  destination: (req, file , cb)=>{
    cb(null, './public/images/uploads')
  },
  filename: (req, file, cb)=>{
    crypto.randomBytes(12, (err, name)=>{
      const fn = name.toString("hex") + path.extname(file.originalname);
      cb(null, fn)
    })
  }
})

const upload = multer({storage: storage});

module.exports = upload;
















// const multer = require("multer");
// const crypto = require("crypto");
// const upload = multer({ storage: storage })

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/images/uploads')
//   },
//   filename: function (req, file, cb) {
//     crypto.randomBytes(12, (err, bytes)=>{
//       const fn = bytes.toString("hex") + path.extname(file.originalname);
//       cb(null, fn)
//     })
//   }
// })

// app.get("/test", (req, res)=>{
//   res.render("test");
// });
// app.post("/upload", upload.single('image'), (req, res)=>{
//   console.log(req.file)
// });