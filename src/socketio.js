import mongoose from "mongoose";
import { io } from "./app.js";
import admin from "firebase-admin";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../TrioRestaurantServiceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const handleConnection = async (socket) => {
  console.log('A user/restaurant/rider connected', socket.id);

  socket.on("FoodyOrderPlaced", async (data) => {
    console.log("Server data", data);
    //get the device token and send the notification
    await admin.messaging().sendEachForMulticast({
      tokens: [data.deviceToken],
      notification: {
        title: 'You Received an Order',
        body: 'A user Placed a order',  // Add food items details also
        imageUrl: 'https://my-cdn.com/app-logo.png',
      }
    });

    socket.emit("RestaurantOrderInform", data)
  })

  socket.on("RestaurantRejectedOrder", async(data)=> {
    //handle foregroundnotification and send socket.emit
    socket.emit("OrderRejectedbyRestaurant", data)
  })

  socket.on("RestaurantAcceptedOrder", async(data)=> {
    //handle foregroundnotification and send socket.emit
    socket.emit("OrderAcceptedbyRestaurant", data)
  })

  // Disconnect event
  socket.on('disconnect', async () => {
    console.log('User disconnected');
  })

};


export { handleConnection }