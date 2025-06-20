import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import userroutes from "./routes/user.js"
import questionroutes from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import avatarRoutes from "./routes/avatar.js"
import publicspaceRoutes from "./routes/publicspace.js"
import friendsRoutes from "./routes/friends.js"
import teamsRoutes from "./routes/teams.js"
import otpRoutes from "./routes/otp.js"
const app = express();
dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }))
app.use(express.urlencoded({ limit: "30mb", extended: true }))
app.use(cors());




app.use("/user", userroutes);
app.use('/questions', questionroutes)
app.use('/answer',answerroutes)
app.use('/uploads', express.static('uploads'));
app.use("/avatar", avatarRoutes);
app.use("/publicspace", publicspaceRoutes);
app.use("/friends", friendsRoutes);
app.use("/api", teamsRoutes);
app.use("/otp", otpRoutes);
app.get('/', (req, res) => {
    res.send("Codequest is running perfect")
})

const PORT = process.env.PORT || 5000
const database_url = process.env.MONGODB_URL
console.log('MONGODB_URL:', database_url); // Debug: print the MongoDB URL

mongoose.connect(database_url)
    .then(() => app.listen(PORT, () => { console.log(`server running on port ${PORT}`) }))
    .catch((err) => console.log(err.message))