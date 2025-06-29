import express from "express"
import  {login,signup} from '../controller/auth.js'
import { getallusers,updateprofile } from "../controller/users.js";
import auth from "../middleware/auth.js"
import multer from 'multer';
import path from 'path';

const router=express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads/')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post("/signup",signup);
router.post("/login",login);

router.get("/getallusers",getallusers)

router.patch("/update/:id",auth,updateprofile)
router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});


export default router