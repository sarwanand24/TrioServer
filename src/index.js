import dotenv from "dotenv";
import connectDB from "./database/index.js";
import {server} from "./app.js";

dotenv.config({
    path: '../.env'
})
console.log(process.env.PORT)

connectDB()
.then(() => {
    server.listen(process.env.PORT, ()=>{
        console.log("Server is running at port : "+process.env.PORT || 3000);
    })
})
.catch((error)=>{
    console.log("MongoDB Connection failed !!!", error);
})
