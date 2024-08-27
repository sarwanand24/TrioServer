import mongoose from "mongoose";
import { io } from "./app.js";
import admin from "firebase-admin";
import { createRequire } from 'module';
import { RestroAcceptReject } from "./models/RestaurantAcceptReject.model.js";
import { Rider } from "./models/Rider.model.js";
import { RiderAcceptReject } from "./models/RiderAcceptReject.model.js";
import { FoodyOrders } from "./models/FoodyOrders.model.js";
import { Restaurant } from "./models/Retaurant.model.js";
import { User } from "./models/User.model.js";
import { ApiError } from "./utils/ApiError.js";
const require = createRequire(import.meta.url);
const tiofyRestroServiceAccount = require('../TiofyRestaurantServiceAccount.json');
const tiofyServiceAccount = require('../TiofyServiceAccount.json');
const tiofyRiderServiceAccount = require('../TiofyRiderServiceAccount.json');

const tiofyApp = admin.initializeApp({
  credential: admin.credential.cert(tiofyServiceAccount),
}, 'tiofyApp');

const tiofyRestaurantApp = admin.initializeApp({
  credential: admin.credential.cert(tiofyRestroServiceAccount),
}, 'tiofyRestaurantApp');

const tiofyRiderApp = admin.initializeApp({
  credential: admin.credential.cert(tiofyRiderServiceAccount),
}, 'tiofyRiderApp');

const handleConnection = async (socket) => {
  console.log('A user/restaurant/rider connected', socket.id);

  socket.on("FoodyOrderPlaced", async (data) => {
    console.log("Server data", data);
    //get the device token and send the notification
    const msg = await tiofyRestaurantApp.messaging().sendEachForMulticast({
      tokens: [data.deviceToken],
      notification: {
        title: 'You Received an Order',
        body: 'A user Placed a order', 
        imageUrl: 'https://wallpaperaccess.com/full/1280818.jpg',
      },
      android: {
        notification: {
          channelId: "order_channel", // Specify your Android notification channel ID
          sound: "order_tone.mp3", // Specify your custom sound file
        },
      },
    });
    console.log("Message", msg.responses[0].error);
    const restro = await RestroAcceptReject.create({
      restaurantId: data.restroId,
      foodItems: data.newSelectedFoods,
      totalItems: data.newTotalItem,
      bill: data.newTotalAmount,
      restroBill: data.newTotalRestroAmount,
      userDeviceToken: data.userDeviceToken,
      userAddress: data.userAddress,
      userId: data.userId,
      riderEarning: data.riderEarning
    })
    console.log(restro);

    if (!restro) {
      throw new ApiError(400, "Error in Creating of Accept/Reject")
    }

    io.emit("RestaurantOrderInform", data);
  })

  socket.on("RestaurantRejectedOrder", async (data) => {
    // await new Promise(resolve => setTimeout(resolve, 10000));
    io.emit("OrderRejectedbyRestaurant", data)
    console.log(data.restroId);
    const restro = await RestroAcceptReject.findByIdAndDelete(data.restroId)

    console.log(restro);

    if (!restro) {
      throw new ApiError(400, "Error in Changing Status of Accept/Reject")
    }
    console.log("UserDeviceToken", restro.userDeviceToken);
    const msg = await tiofyApp.messaging().sendEachForMulticast({
      tokens: [restro.userDeviceToken],
      notification: {
        title: 'OOps',
        body: 'The Restaurant Rejected Order',  // Add food items details also
        imageUrl: 'https://wallpaperaccess.com/full/1280818.jpg',
      }
    });
    console.log("Message", msg);

  })

  const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => x * Math.PI / 180;
    const R = 6371; // Radius of Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };
  
  socket.on("RestaurantAcceptedOrder", async (data) => {
  
    io.emit("OrderAcceptedbyRestaurant", data);
  
    const restro = await RestroAcceptReject.findByIdAndUpdate(
      data.restroId,
      {
        $set: {
          status: true
        }
      },
      { new: true }
    );
  
    if (!restro) {
      throw new ApiError(400, "Error in Changing Status of Accept/Reject");
    }

    const restaurant = await Restaurant.findById(restro.restaurantId);
  
    const restaurantLat = restaurant.latitude; // Assuming latitude field
    const restaurantLon = restaurant.longitude; // Assuming longitude field
  
    const riders = await Rider.find({ city: data.city });

    console.log('restaurant lat Long',restaurant, restaurantLat, restaurantLon);
  
    if (!riders || riders.length === 0) {
      io.emit("NoRidersFound", data);
      return
    }

    const findAndNotifyRider = async (ridersList) => {
      if (ridersList.length === 0) {
        io.emit("NoRidersFound", data);
        return;
      }

      let nearestRider = null;
      let minDistance = Infinity;

      ridersList.forEach(rider => {
        const distance = haversine(restaurantLat, restaurantLon, rider.latitude, rider.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          nearestRider = rider;
        }
      });

      if (!nearestRider) {
        io.emit("NoRidersFound", data);
        return;
      }

      const msg2 = await tiofyRiderApp.messaging().sendEachForMulticast({
        tokens: [nearestRider.deviceToken],
        notification: {
          title: 'You Received an Order From Foody',
          body: 'A user Placed an order', // Add food items details also
          imageUrl: 'https://wallpaperaccess.com/full/1280818.jpg',
        },
        android: {
          notification: {
            channelId: "order_channel",
            sound: "order_tone.mp3",
          },
        },
      });

      const riderOrder = await RiderAcceptReject.create({
        riderId: nearestRider._id,
        restaurantName: data.restroName,
        restaurantAddress: data.restroAddress,
        userDeviceToken: restro.userDeviceToken,
        userAddress: data.userAddress,
        userId: data.userId,
        restaurantId: restro.restaurantId,
        foodItems: data.foodItems,
        totalItems: data.totalItems,
        bill: data.bill,
        restroEarning: data.restroBill,
        riderEarning: data.riderEarning,
        city: data.city,
        orderOf: 'Foody'
      });

      if (!riderOrder) {
        throw new ApiError(400, "Error in Creating of Accept/Reject");
      }

      io.emit("RiderOrderInform", {
        data,
        restaurantId: restro.restaurantId,
        riderId: riderOrder.riderId,
        restroEarning: data.restroBill,
        riderEarning: data.riderEarning
      });

      // Start timeout for rider response
      setTimeout(async () => {
        const updatedRiderOrder = await RiderAcceptReject.findById(riderOrder._id);
        if (!updatedRiderOrder.status) {
          console.log(`Rider ${riderOrder.riderId} did not respond to the order within 30 seconds.`);
          await RiderAcceptReject.findByIdAndDelete(riderOrder._id);

          // Exclude the non-responsive rider and try again
          const remainingRiders = ridersList.filter(rider => rider._id.toString() !== riderOrder.riderId.toString());
          findAndNotifyRider(remainingRiders); // Recursive call to handle the next rider
        }
      }, 30000);
    };

    findAndNotifyRider(riders);

  });

  socket.on("RiderAcceptedOrder", async (data) => {

    const rider = await RiderAcceptReject.findByIdAndUpdate(
      data.riderId,
      {
        $set: {
          status: true
        }
      },
      { new: true })

    if (!rider) {
      throw new ApiError(400, "Error in Changing Status of Accept/Reject")
    }
    console.log("UserDeviceToken", rider.userDeviceToken);
    const msg = await tiofyApp.messaging().sendEachForMulticast({
      tokens: [rider.userDeviceToken],
      notification: {
        title: 'Get Ready to Eat',
        body: 'The Rider Accepted Order',  // Add food items details also
        imageUrl: 'https://wallpaperaccess.com/full/1280818.jpg',
      }
    });
    console.log("Message", msg);

    const order = await FoodyOrders.create({
      orderedBy: new mongoose.Types.ObjectId(data.userId),
      rider: new mongoose.Types.ObjectId(rider.riderId),
      restaurant: new mongoose.Types.ObjectId(rider.restaurantId),
      orderedFromLocation: rider.userAddress,
      bill: data.bill,
      items: data.foodItems,
      restroEarning: data.restroEarning,
      riderEarning: data.riderEarning,
      orderStatus: "Making the order"
    })

    if (!order) {
      throw new ApiError(400, "Error in creating order")
    }

    io.emit("OrderAcceptedbyRider", { data, orderId: order._id, riderId: rider.riderId })

    const restroOrder = await Restaurant.findByIdAndUpdate(
      rider.restaurantId,
      {
        $push: {
          OrderHistory: new mongoose.Types.ObjectId(order._id)
        }
      },
      {
        new: true
      })

    if (!restroOrder) {
      throw new ApiError(400, "Error in adding Restaurant Order history")
    }

    const riderOrder = await Rider.findByIdAndUpdate(
      rider.riderId,
      {
        $push: {
          foodyRideHistory: new mongoose.Types.ObjectId(order._id)
        }
      },
      {
        new: true
      })

    if (!riderOrder) {
      throw new ApiError(400, "Error in adding order history")
    }

    const userOrder = await User.findByIdAndUpdate(
      data.userId,
      {
        $push: {
          foodyOrderHistory: new mongoose.Types.ObjectId(order._id)
        }
      },
      {
        new: true
      })

    if (!userOrder) {
      throw new ApiError(400, "Error in adding Users order history")
    }

  })

  socket.on("RiderRejectedOrder", async (data) => {
    // Delete the rejected rider's data from RiderAcceptReject
    const riderRejected = await RiderAcceptReject.findByIdAndDelete(data.riderId);
  
    if (!riderRejected) {
      throw new ApiError(400, "Error in Deleting Accept/Reject");
    }
  
    // Retrieve the restaurant's coordinates
    const restaurant = await Restaurant.findById(data.restaurantId);
    if (!restaurant) {
      throw new ApiError(400, "Restaurant not found");
    }
  
    const { latitude: restaurantLat, longitude: restaurantLon } = restaurant;
  
    // Function to handle finding a new rider
    const findAndNotifyRider = async (excludedRiderIds = []) => {
      // Find available riders in the city excluding the rejected ones
      const availableRiders = await Rider.find({
        city: data.city,
        _id: { $nin: excludedRiderIds } // Exclude previously rejected riders
      });
  
      if (availableRiders.length === 0) {
        io.emit("NoRidersFound", { userId: data.userId });
        return;
      }
  
      // Calculate distance for each rider and find the nearest one
      let nearestRider = null;
      let minDistance = Infinity;
  
      for (const rider of availableRiders) {
        const { latitude: riderLat, longitude: riderLon } = rider;
        const distance = haversine(restaurantLat, restaurantLon, riderLat, riderLon);
        if (distance < minDistance) {
          minDistance = distance;
          nearestRider = rider;
        }
      }
  
      if (!nearestRider) {
        io.emit("NoRidersFound", { userId: data.userId });
        return;
      }
  
      // Send a notification to the nearest rider
      const msg = await tiofyRiderApp.messaging().sendEachForMulticast({
        tokens: [nearestRider.deviceToken],
        notification: {
          title: 'You Received an Order From Foody',
          body: 'A user placed an order',  // Add food items details also
          imageUrl: 'https://wallpaperaccess.com/full/1280818.jpg',
        },
        android: {
          notification: {
            channelId: "order_channel", // Specify your Android notification channel ID
            sound: "order_tone.mp3", // Specify your custom sound file
          },
        },
      });
  
      // Create a new entry in RiderAcceptReject for the selected rider
      const newRiderOrder = await RiderAcceptReject.create({
        riderId: nearestRider._id,
        restaurantName: data.restroName,
        restaurantAddress: data.restroAddress,
        userDeviceToken: riderRejected.userDeviceToken,
        userAddress: data.userAddress,
        userId: data.userId,
        restaurantId: data.restaurantId,
        foodItems: data.foodItems,
        totalItems: data.totalItems,
        bill: data.bill,
        restroEarning: data.restroEarning,
        riderEarning: data.riderEarning,
        city: data.city,
        orderOf: 'Foody'
      });
  
      if (!newRiderOrder) {
        throw new ApiError(400, "Error in Creating Accept/Reject Entry");
      }
  
      // Emit event to inform the client about the new rider selection
      io.emit("RiderOrderInform", {
        data,
        restaurantId: data.restaurantId,
        riderId: newRiderOrder.riderId,
        restroEarning: data.restroEarning,
        riderEarning: data.riderEarning
      });
  
      // Start timeout for the new rider's response
      setTimeout(async () => {
        // Check if the new rider has responded within the timeout
        const updatedRiderOrder = await RiderAcceptReject.findById(newRiderOrder._id);
        if (!updatedRiderOrder.status) {
          console.log(`Rider ${newRiderOrder.riderId} did not respond to the order within 30 seconds.`);
          await RiderAcceptReject.findByIdAndDelete(newRiderOrder._id);
          
          // Recursively find another nearest rider if the current rider didn't respond
          await findAndNotifyRider([...excludedRiderIds, nearestRider._id, newRiderOrder.riderId]);
        }
      }, 30000);
    };
  
    // Start the process of finding and notifying a rider
    await findAndNotifyRider([riderRejected.riderId]);
  });  
  
  socket.on("RiderCurrentLocation", async (data) => {
    io.emit("CurrentLocationofRiderToUser", data)
  })

  // Disconnect event
  socket.on('disconnect', async () => {
    console.log('User disconnected');
  })

};


export { handleConnection }