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
const trioRestroServiceAccount = require('../TrioRestaurantServiceAccount.json');
const trioServiceAccount = require('../TrioServiceAccount.json');
const trioRiderServiceAccount = require('../TrioRiderServiceAccount.json');

const trioApp = admin.initializeApp({
  credential: admin.credential.cert(trioServiceAccount),
}, 'trioApp');

const trioRestaurantApp = admin.initializeApp({
  credential: admin.credential.cert(trioRestroServiceAccount),
}, 'trioRestaurantApp');

const trioRiderApp = admin.initializeApp({
  credential: admin.credential.cert(trioRiderServiceAccount),
}, 'trioRiderApp');

const handleConnection = async (socket) => {
  console.log('A user/restaurant/rider connected', socket.id);

  socket.on("FoodyOrderPlaced", async (data) => {
    console.log("Server data", data);
    //get the device token and send the notification
    const msg = await trioRestaurantApp.messaging().sendEachForMulticast({
      tokens: [data.deviceToken],
      notification: {
        title: 'You Received an Order',
        body: 'A user Placed a order',  // Add food items details also
        imageUrl: 'https://my-cdn.com/app-logo.png',
      }
    });
    console.log("Message", msg);
    const restro = await RestroAcceptReject.create({
      restaurantId: data.restroId,
      foodItems: data.newSelectedFoods,
      totalItems: data.newTotalItem,
      bill: data.newTotalAmount,
      userDeviceToken: data.userDeviceToken,
      userAddress: data.userAddress,
      userId: data.userId
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
    const msg = await trioApp.messaging().sendEachForMulticast({
      tokens: [restro.userDeviceToken],
      notification: {
        title: 'OOps',
        body: 'The Restaurant Rejected Order',  // Add food items details also
        imageUrl: 'https://my-cdn.com/app-logo.png',
      }
    });
    console.log("Message", msg);

  })

  socket.on("RestaurantAcceptedOrder", async (data) => {
  
    io.emit("OrderAcceptedbyRestaurant", data)

    const restro = await RestroAcceptReject.findByIdAndUpdate(
      data.restroId,
      {
        $set: {
          status: true
        }
      },
      { new: true })

    if (!restro) {
      throw new ApiError(400, "Error in Changing Status of Accept/Reject")
    }
    console.log("UserDeviceToken", restro.userDeviceToken);
    const msg = await trioApp.messaging().sendEachForMulticast({
      tokens: [restro.userDeviceToken],
      notification: {
        title: 'Get Ready to Eat',
        body: 'The Restaurant Accepted Order',  // Add food items details also
        imageUrl: 'https://my-cdn.com/app-logo.png',
      }
    });
    console.log("Message", msg);

    const rider = await Rider.aggregate([
      {
        $match: {
          zone: data.zone,
          city: data.city
        }
      }
    ])

    if (!rider) {
      throw new ApiError(400, "Error in Finding Riders")
    }

    let randomIndex;

    if (rider.length === 1) {
      // If the array has only one element, set the random index to 0
      randomIndex = 0;
    } else {
      // If the array has more than one element, generate a random index as usual
      randomIndex = Math.floor(Math.random() * rider.length);
    }

    console.log(randomIndex);
    console.log("Rider Device Token", rider[randomIndex].deviceToken);
    const msg2 = await trioRiderApp.messaging().sendEachForMulticast({
      tokens: [rider[randomIndex].deviceToken],
      notification: {
        title: 'You Received an Order From Foody',
        body: 'A user Placed a order',  // Add food items details also
        imageUrl: 'https://my-cdn.com/app-logo.png',
      }
    });
    console.log("Message", msg2);
    console.log("RestroId", restro.restaurantId);
    console.log("Data or Checking FoodItems", data);
    const rider2 = await RiderAcceptReject.create({
      riderId: rider[randomIndex]._id,
      restaurantName: data.restroName,
      restaurantAddress: data.restroAddress,
      userDeviceToken: restro.userDeviceToken,
      userAddress: data.userAddress,
      userId: data.userId,
      restaurantId: restro.restaurantId,
      foodItems: data.foodItems,
      totalItems: data.totalItems,
      bill: data.bill,
      zone: data.zone,
      city: data.city
    })

    if (!rider2) {
      throw new ApiError(400, "Error in Creating of Accept/Reject")
    }

    io.emit("RiderOrderInform", { data, restaurantId: restro.restaurantId, riderId: rider2.riderId });

      // Start timeout for rider response
      setTimeout(async () => {
        // Check if rider has responded within timeout
        const updatedRiderOrder = await RiderAcceptReject.findById(rider2._id);
        if (!updatedRiderOrder.status) {
            console.log(`Rider ${rider2.riderId} did not respond to the order within 30sec seconds.`);
            const anotherRider = await Rider.aggregate([
              {
                $match: {
                  zone: data.zone,
                  city: data.city
                }
              }
            ])
        
            if (!anotherRider) {
              throw new ApiError(400, "Error in Finding Riders")
            }
        
            let randomIndex;
        
            if (anotherRider.length === 1) {
              // If the array has only one element, set the random index to 0
              randomIndex = 0;
            } else {
              // If the array has more than one element, generate a random index as usual
              randomIndex = Math.floor(Math.random() * anotherRider.length);
            }
        
            console.log(randomIndex);
            console.log("Rider Device Token", anotherRider[randomIndex].deviceToken);
            const msg2 = await trioRiderApp.messaging().sendEachForMulticast({
              tokens: [anotherRider[randomIndex].deviceToken],
              notification: {
                title: 'You Received an Order From Foody',
                body: 'A user Placed a order',  // Add food items details also
                imageUrl: 'https://my-cdn.com/app-logo.png',
              }
            });
            console.log("Message", msg2);
            console.log("RestroId", restro.restaurantId);
            console.log("Data or Checking FoodItems", data);
            const anotherRider2 = await RiderAcceptReject.create({
              riderId: anotherRider[randomIndex]._id,
              restaurantName: data.restroName,
              restaurantAddress: data.restroAddress,
              userDeviceToken: restro.userDeviceToken,
              userAddress: data.userAddress,
              userId: data.userId,
              restaurantId: restro.restaurantId,
              foodItems: data.foodItems,
              totalItems: data.totalItems,
              bill: data.bill,
              zone: data.zone,
              city: data.city
            })
        
            if (!anotherRider2) {
              throw new ApiError(400, "Error in Creating of Accept/Reject")
            }
        }
    }, 30000);

  })

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
    const msg = await trioApp.messaging().sendEachForMulticast({
      tokens: [rider.userDeviceToken],
      notification: {
        title: 'Get Ready to Eat',
        body: 'The Rider Accepted Order',  // Add food items details also
        imageUrl: 'https://my-cdn.com/app-logo.png',
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
      orderStatus: "Making the order"
    })

    if (!order) {
      throw new ApiError(400, "Error in creating order")
    }

    io.emit("OrderAcceptedbyRider", {data, orderId: order._id})

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
 
    if(!riderOrder){
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
 
    if(!userOrder){
      throw new ApiError(400, "Error in adding Users order history")
    }

  })

  socket.on("RiderRejectedOrder", async(data) => {
    const riderRejected = await RiderAcceptReject.findByIdAndDelete(data.riderId)

    if (!riderRejected) {
      throw new ApiError(400, "Error in Deleting of Accept/Reject")
    }

    const rider = await Rider.aggregate([
      {
        $match: {
          zone: data.zone,
          city: data.city
        }
      }
    ])

    if (!rider) {
      throw new ApiError(400, "Error in Finding Riders")
    }

    let randomIndex;

    if (rider.length === 1) {
      // If the array has only one element, set the random index to 0
      randomIndex = 0;
    } else {
      // If the array has more than one element, generate a random index as usual
      randomIndex = Math.floor(Math.random() * rider.length);
    }

    console.log(randomIndex);
    console.log("Rider Device Token", rider[randomIndex].deviceToken);
    const msg2 = await trioRiderApp.messaging().sendEachForMulticast({
      tokens: [rider[randomIndex].deviceToken],
      notification: {
        title: 'You Received an Order From Foody',
        body: 'A user Placed a order',  // Add food items details also
        imageUrl: 'https://my-cdn.com/app-logo.png',
      }
    });
    console.log("Message", msg2);
    console.log("RestroId", data.restaurantId);
    const rider2 = await RiderAcceptReject.create({
      riderId: rider[randomIndex]._id,
      restaurantName: data.restroName,
      restaurantAddress: data.restroAddress,
      userDeviceToken: riderRejected.userDeviceToken,
      userAddress: data.userAddress,
      userSocket: data.socket,
      userId: data.userId,
      restaurantId: riderRejected.restaurantId,
      foodItems: data.foodItems,
      totalItems: data.totalItems,
      bill: data.bill,
      zone: data.zone,
      city: data.city
    })

    if (!rider2) {
      throw new ApiError(400, "Error in Creating of Accept/Reject")
    }

    io.emit("RiderOrderInform", { data, restaurantId: riderRejected.restaurantId, riderId: rider2.riderId  });

        // Start timeout for rider response (Could possibly be tested when rider app is built)
        setTimeout(async () => {
          // Check if rider has responded within timeout
          const updatedRiderOrder = await RiderAcceptReject.findById(rider2._id);
          if (!updatedRiderOrder.status) {
              console.log(`Rider ${rider2.riderId} did not respond to the order within 30sec seconds.`);
              const anotherRider = await Rider.aggregate([
                {
                  $match: {
                    zone: data.zone,
                    city: data.city
                  }
                }
              ])
          
              if (!anotherRider) {
                throw new ApiError(400, "Error in Finding Riders")
              }
          
              let randomIndex;
          
              if (anotherRider.length === 1) {
                // If the array has only one element, set the random index to 0
                randomIndex = 0;
              } else {
                // If the array has more than one element, generate a random index as usual
                randomIndex = Math.floor(Math.random() * anotherRider.length);
              }
          
              console.log(randomIndex);
              console.log("Rider Device Token", anotherRider[randomIndex].deviceToken);
              const msg2 = await trioRiderApp.messaging().sendEachForMulticast({
                tokens: [anotherRider[randomIndex].deviceToken],
                notification: {
                  title: 'You Received an Order From Foody',
                  body: 'A user Placed a order',  // Add food items details also
                  imageUrl: 'https://my-cdn.com/app-logo.png',
                }
              });
              console.log("Message", msg2);
              console.log("RestroId", restro.restaurantId);
              console.log("Data or Checking FoodItems", data);
              const anotherRider2 = await RiderAcceptReject.create({
                riderId: anotherRider[randomIndex]._id,
                restaurantName: data.restroName,
                restaurantAddress: data.restroAddress,
                userDeviceToken: restro.userDeviceToken,
                userAddress: data.userAddress,
                userId: data.userId,
                restaurantId: restro.restaurantId,
                foodItems: data.foodItems,
                totalItems: data.totalItems,
                bill: data.bill,
                zone: data.zone,
                city: data.city
              })
          
              if (!anotherRider2) {
                throw new ApiError(400, "Error in Creating of Accept/Reject")
              }
          }
      }, 30000);

  })

  socket.on("RiderCurrentLocation", async(data)=> {
     io.emit("CurrentLocationofRiderToUser", data)
  })

  // Disconnect event
  socket.on('disconnect', async () => {
    console.log('User disconnected');
  })

};


export { handleConnection }