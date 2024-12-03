import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

const app = express();

app.use(cors({
    origin: "*",
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//SocketIO connection

const server = http.createServer(app);
const io = new Server(server, {
   cors: {
    origin: "https://trioserver.onrender.com",
    credentials: true,
    methods: ["GET", "POST"]
   } 
});

import { handleConnection } from "./socketio.js";

io.on("connection", handleConnection)

//routes

import userRouter from "./routes/user.routes.js";
import restaurantRouter from "./routes/restaurant.routes.js";
import riderRouter from "./routes/rider.routes.js";
import hotelRouter from "./routes/hotel.routes.js";
import flatRouter from "./routes/flat.routes.js";
import laundryRouter from "./routes/laundry.routes.js";
import laundryOrderRouter from "./routes/laundryOrders.routes.js";
import laundryCancelledOrderRouter from "./routes/laundryCancelledOrders.routes.js";
import foodyRatingRouter from "./routes/foodyRatings.routes.js";
import foodyOrderRouter from "./routes/foodyOrders.routes.js";
import foodyCancelledOrderRouter from "./routes/foodyCancelledOrders.routes.js";
import favouriteFoodRouter from "./routes/favouriteFoods.routes.js";
import cyrRatingRouter from "./routes/cyrRatings.routes.js";
import cyrOrderRouter from "./routes/cyrOrders.routes.js";
import cyrCancelledRide from "./routes/cyrCancelledRides.routes.js";
import paymentRouter from "./routes/payments.routes.js";
import hotelOrderRouter from "./routes/hotelOrders.routes.js";
import hotelRatingRouter from "./routes/hotelRatings.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/restaurants", restaurantRouter);
app.use("/api/v1/riders", riderRouter);
app.use("/api/v1/hotels", hotelRouter);
app.use("/api/v1/flats", flatRouter);
app.use("/api/v1/laundry", laundryRouter);
app.use("/api/v1/laundryOrder", laundryOrderRouter);
app.use("/api/v1/laundryCancelledOrder", laundryCancelledOrderRouter);
app.use("/api/v1/foodyRating", foodyRatingRouter);
app.use("/api/v1/foodyOrder", foodyOrderRouter);
app.use("/api/v1/foodyCancelledOrder", foodyCancelledOrderRouter);
app.use("/api/v1/favouriteFood", favouriteFoodRouter);
app.use("/api/v1/cyrRating", cyrRatingRouter);
app.use("/api/v1/cyrOrder", cyrOrderRouter);
app.use("/api/v1/cyrCancelledRide", cyrCancelledRide);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/hotelOrder", hotelOrderRouter);
app.use("/api/v1/hotelRating", hotelRatingRouter);

export {
    app,
    server,
    io
    }