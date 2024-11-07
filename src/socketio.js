import mongoose from "mongoose";
import { io } from "./app.js";
import admin from "firebase-admin";
import { createRequire } from 'module';
import { RestroAcceptReject } from "./models/RestaurantAcceptReject.model.js";
import { Rider } from "./models/Rider.model.js";
import { RiderAcceptReject } from "./models/RiderAcceptReject.model.js";
import { FoodyOrders } from "./models/FoodyOrders.model.js";
import { Restaurant } from "./models/Restaurant.model.js";
import { User } from "./models/User.model.js";
import { ApiError } from "./utils/ApiError.js";
import { FoodyCancelledOrders } from "./models/FoodyCancelledOrders.model.js";
import { CYROrders } from "./models/CYROrders.model.js";
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

  /**************************** FOOD ORDERS SOCKETS ********************************/

  socket.on("FoodyOrderPlaced", async (data) => {
    console.log("Server data", data);
    //get the device token and send the notification
    const msg = await tiofyRestaurantApp.messaging().sendEachForMulticast({
      tokens: [data.deviceToken],
      notification: {
        title: 'New Order Alert!',
        body: 'A customer just placed an order. Please confirm and start preparing it now.',
        imageUrl: 'https://png.pngtree.com/background/20230426/original/pngtree-chef-preparing-a-dish-in-a-restaurant-picture-image_2482776.jpg',
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
      riderEarning: data.riderEarning,
      restroDeviceToken: data.deviceToken,
      otp: data.otp
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
        title: 'Order Rejected 😕',
        body: 'Oops! The restaurant is swamped and had to reject your order. Don’t worry, your cravings will be satisfied soon!', // Add food items details also
        imageUrl: 'https://img.freepik.com/premium-photo/3d-illustration-funny-chef-white-toque-apron-looking-shocked-overwhelmed-messy-kitchen_14117-494612.jpg',
      },
      android: {
        notification: {
          channelId: "order_channel", // Specify your Android notification channel ID
          sound: "order_tone.mp3", // Specify your custom sound file
        },
      },
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

    const order = await FoodyOrders.create({
      orderedBy: new mongoose.Types.ObjectId(data.userId),
      restaurant: new mongoose.Types.ObjectId(restro.restaurantId),
      orderedFromLocation: restro.userAddress,
      bill: data.bill,
      items: data.foodItems,
      restroEarning: data.restroBill,
      riderEarning: data.riderEarning,
      orderStatus: "Your Order is getting Prepared",
      otp: restro.otp
    })

    if (!order) {
      throw new ApiError(400, "Error in creating order")
    }

    io.emit("OrderAcceptedbyRestaurant", { data, orderId: order._id });

    console.log("UserDeviceToken", restro.userDeviceToken);
    const msg = await tiofyApp.messaging().sendEachForMulticast({
      tokens: [restro.userDeviceToken],
      notification: {
        title: 'Hurray! The Restaurant Accepted Your Order',
        body: 'Your Order is Placed, we are finding a suitable rider for you and will inform you asap.',  // Add food items details also
        imageUrl: 'https://thumbs.dreamstime.com/b/ai-generated-mouth-watering-image-home-cooked-meal-captured-high-definition-warm-golden-lighting-hyperdetailed-270551119.jpg',
      },
      android: {
        notification: {
          channelId: "order_channel", // Specify your Android notification channel ID
          sound: "order_tone.mp3", // Specify your custom sound file
        },
      },
    });
    console.log("Message", msg);

    const restaurant = await Restaurant.findById(restro.restaurantId);

    const restaurantLat = restaurant.latitude; // Assuming latitude field
    const restaurantLon = restaurant.longitude; // Assuming longitude field

    const riders = await Rider.find({ city: data.city, availableStatus: true });

    console.log('restaurant lat Long', restaurant, restaurantLat, restaurantLon);

    if (!riders || riders.length === 0) {
      const msg = await tiofyRestaurantApp.messaging().sendEachForMulticast({
        tokens: [restro.restroDeviceToken],
        notification: {
          title: 'Cancelled Order',
          body: 'Sorry! We are unable to find any rider for delivery so please cancel this order.',
          imageUrl: 'https://th.bing.com/th/id/OIP.I4OyONg5cqmX2UCXn27H2QHaHa?rs=1&pid=ImgDetMain',
        },
        android: {
          notification: {
            channelId: "order_channel", // Specify your Android notification channel ID
            sound: "order_tone.mp3", // Specify your custom sound file
          },
        },
      });
      console.log("Message", msg.responses[0].error);
      await FoodyOrders.findByIdAndDelete(order._id);
      const msg2 = await tiofyApp.messaging().sendEachForMulticast({
        tokens: [restro.userDeviceToken],
        notification: {
          title: 'Cancelled Order',
          body: 'Sorry! We are unable to find any rider for delivery so we are cancelling this order.',
          imageUrl: 'https://th.bing.com/th/id/OIP.I4OyONg5cqmX2UCXn27H2QHaHa?rs=1&pid=ImgDetMain',
        },
        android: {
          notification: {
            channelId: "order_channel", // Specify your Android notification channel ID
            sound: "order_tone.mp3", // Specify your custom sound file
          },
        },
      });
      console.log("Message", msg2.responses[0].error);
      const cancelledOrder = await FoodyCancelledOrders.create({
        user: new mongoose.Types.ObjectId(data.userId),
        restaurant: new mongoose.Types.ObjectId(restro.restaurantId),
        orderedFromLocation: restro.userAddress,
        bill: data.bill,
        items: data.foodItems,
        restroEarning: data.restroBill,
        orderStatus: "Cancelled",
        reason: 'No riders available for delivery'
      })

      if (!cancelledOrder) {
        throw new ApiError(400, 'Error in creating cancelled Order')
      }

      return
    }

    const findAndNotifyRider = async (ridersList) => {
      if (ridersList.length === 0) {
        const msg = await tiofyRestaurantApp.messaging().sendEachForMulticast({
          tokens: [restro.restroDeviceToken],
          notification: {
            title: 'Cancelled Order',
            body: 'Sorry! We are unable to find any rider for delivery so please cancel this order.',
            imageUrl: 'https://th.bing.com/th/id/OIP.I4OyONg5cqmX2UCXn27H2QHaHa?rs=1&pid=ImgDetMain',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg.responses[0].error);
        await FoodyOrders.findByIdAndDelete(order._id);
        const msg2 = await tiofyApp.messaging().sendEachForMulticast({
          tokens: [restro.userDeviceToken],
          notification: {
            title: 'Order Cancelled 😔',
            body: 'We’re really sorry! We couldn’t find a rider for your Food Items. Please consider this order as cancelled and try again soon.',
            imageUrl: 'https://res.cloudinary.com/teepublic/image/private/s--iHow91xW--/t_Resized%20Artwork/c_fit,g_north_west,h_954,w_954/co_000000,e_outline:48/co_000000,e_outline:inner_fill:48/co_ffffff,e_outline:48/co_ffffff,e_outline:inner_fill:48/co_bbbbbb,e_outline:3:1000/c_mpad,g_center,h_1260,w_1260/b_rgb:eeeeee/c_limit,f_auto,h_630,q_90,w_630/v1564514493/production/designs/5462333_0.jpg',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg2.responses[0].error);
        const cancelledOrder = await FoodyCancelledOrders.create({
          user: new mongoose.Types.ObjectId(data.userId),
          restaurant: new mongoose.Types.ObjectId(restro.restaurantId),
          orderedFromLocation: restro.userAddress,
          bill: data.bill,
          items: data.foodItems,
          restroEarning: data.restroBill,
          orderStatus: "Cancelled",
          reason: 'No riders available for delivery'
        })

        if (!cancelledOrder) {
          throw new ApiError(400, 'Error in creating cancelled Order')
        }
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
        const msg = await tiofyRestaurantApp.messaging().sendEachForMulticast({
          tokens: [restro.restroDeviceToken],
          notification: {
            title: 'Cancelled Order',
            body: 'Sorry! We are unable to find any rider for delivery so please consider this order as cancelled.',
            imageUrl: 'https://th.bing.com/th/id/OIP.I4OyONg5cqmX2UCXn27H2QHaHa?rs=1&pid=ImgDetMain',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg.responses[0].error);
        await FoodyOrders.findByIdAndDelete(order._id);
        const msg2 = await tiofyApp.messaging().sendEachForMulticast({
          tokens: [restro.userDeviceToken],
          notification: {
            title: 'Order Cancelled 😔',
            body: 'We’re really sorry! We couldn’t find a rider for your Food Items. Please consider this order as cancelled and try again soon.',
            imageUrl: 'https://res.cloudinary.com/teepublic/image/private/s--iHow91xW--/t_Resized%20Artwork/c_fit,g_north_west,h_954,w_954/co_000000,e_outline:48/co_000000,e_outline:inner_fill:48/co_ffffff,e_outline:48/co_ffffff,e_outline:inner_fill:48/co_bbbbbb,e_outline:3:1000/c_mpad,g_center,h_1260,w_1260/b_rgb:eeeeee/c_limit,f_auto,h_630,q_90,w_630/v1564514493/production/designs/5462333_0.jpg',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg2.responses[0].error);
        const cancelledOrder = await FoodyCancelledOrders.create({
          user: new mongoose.Types.ObjectId(data.userId),
          restaurant: new mongoose.Types.ObjectId(restro.restaurantId),
          orderedFromLocation: restro.userAddress,
          bill: data.bill,
          items: data.foodItems,
          restroEarning: data.restroBill,
          orderStatus: "Cancelled",
          reason: 'No riders available for delivery'
        })

        if (!cancelledOrder) {
          throw new ApiError(400, 'Error in creating cancelled Order')
        }
        return;
      }

      const msg2 = await tiofyRiderApp.messaging().sendEachForMulticast({
        tokens: [nearestRider.deviceToken],
        notification: {
          title: 'New Order from Foody! 🍔',
          body: 'A user just placed an order. Get ready to deliver some deliciousness!',
          imageUrl: 'https://img.freepik.com/premium-photo/middleaged-food-delivery-rider-action_895561-5174.jpg',
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
        restroDeviceToken: restro.restroDeviceToken,
        userAddress: data.userAddress,
        userId: data.userId,
        restaurantId: restro.restaurantId,
        foodItems: data.foodItems,
        totalItems: data.totalItems,
        bill: data.bill,
        restroEarning: data.restroBill,
        riderEarning: data.riderEarning,
        city: data.city,
        orderId: order._id,
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
        if (!updatedRiderOrder?.status) {
          console.log(`Rider ${riderOrder.riderId} did not respond to the order within 90 seconds.`);
          await RiderAcceptReject.findByIdAndDelete(riderOrder._id);

          // Exclude the non-responsive rider and try again
          const remainingRiders = ridersList.filter(rider => rider._id.toString() !== riderOrder.riderId.toString());
          findAndNotifyRider(remainingRiders); // Recursive call to handle the next rider
        }
      }, 90000);
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
        title: 'Get Ready to Eat! 🍽️',
        body: 'Your rider just accepted the order and will pick up your food items from the restaurant soon. Stay hungry!',  // Add food items details also
        imageUrl: 'https://img.freepik.com/premium-photo/middleaged-food-delivery-rider-action_895561-5174.jpg',
      },
      android: {
        notification: {
          channelId: "order_channel", // Specify your Android notification channel ID
          sound: "order_tone.mp3", // Specify your custom sound file
        },
      },
    });
    console.log("Message", msg);

    const order = await FoodyOrders.findByIdAndUpdate(rider.orderId, {
      $set: {
        rider: new mongoose.Types.ObjectId(rider.riderId),
      }
    }, { new: true })

    if (!order) {
      throw new ApiError(400, "Error in updating order")
    }

    io.emit('OrderAcceptedbyRider', { orderId: order._id })

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
        availableStatus: true,
        _id: { $nin: excludedRiderIds } // Exclude previously rejected riders
      });

      if (availableRiders.length === 0) {
        console.log('No riders available .........', data.userId, riderRejected);
        const msg = await tiofyRestaurantApp.messaging().sendEachForMulticast({
          tokens: [riderRejected.restroDeviceToken],
          notification: {
            title: 'Order Cancelled 😔',
            body: 'We’re really sorry! We couldn’t find a rider for your Food Items. Please consider this order as cancelled and try again soon.',
            imageUrl: 'https://res.cloudinary.com/teepublic/image/private/s--iHow91xW--/t_Resized%20Artwork/c_fit,g_north_west,h_954,w_954/co_000000,e_outline:48/co_000000,e_outline:inner_fill:48/co_ffffff,e_outline:48/co_ffffff,e_outline:inner_fill:48/co_bbbbbb,e_outline:3:1000/c_mpad,g_center,h_1260,w_1260/b_rgb:eeeeee/c_limit,f_auto,h_630,q_90,w_630/v1564514493/production/designs/5462333_0.jpg',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg.responses[0].error);
        await FoodyOrders.findByIdAndDelete(riderRejected.orderId);
        const msg2 = await tiofyApp.messaging().sendEachForMulticast({
          tokens: [riderRejected.userDeviceToken],
          notification: {
            title: 'Order Cancelled 😔',
            body: 'We’re really sorry! We couldn’t find a rider for your Food Items. Please consider this order as cancelled and try again soon.',
            imageUrl: 'https://res.cloudinary.com/teepublic/image/private/s--iHow91xW--/t_Resized%20Artwork/c_fit,g_north_west,h_954,w_954/co_000000,e_outline:48/co_000000,e_outline:inner_fill:48/co_ffffff,e_outline:48/co_ffffff,e_outline:inner_fill:48/co_bbbbbb,e_outline:3:1000/c_mpad,g_center,h_1260,w_1260/b_rgb:eeeeee/c_limit,f_auto,h_630,q_90,w_630/v1564514493/production/designs/5462333_0.jpg',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg2.responses[0].error);
        const cancelledOrder = await FoodyCancelledOrders.create({
          user: new mongoose.Types.ObjectId(riderRejected.userId),
          restaurant: new mongoose.Types.ObjectId(riderRejected.restaurantId),
          orderedFromLocation: riderRejected.userAddress,
          bill: riderRejected.bill,
          items: riderRejected.foodItems,
          restroEarning: riderRejected.restroEarning,
          orderStatus: "Cancelled",
          reason: 'No riders available for delivery'
        })

        if (!cancelledOrder) {
          throw new ApiError(400, 'Error in creating cancelled Order')
        }

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
        const msg = await tiofyRestaurantApp.messaging().sendEachForMulticast({
          tokens: [riderRejected.restroDeviceToken],
          notification: {
            title: 'Cancelled Order',
            body: 'Sorry! We are unable to find any rider for delivery so please cancel this order.',
            imageUrl: 'https://th.bing.com/th/id/OIP.I4OyONg5cqmX2UCXn27H2QHaHa?rs=1&pid=ImgDetMain',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg.responses[0].error);
        await FoodyOrders.findByIdAndDelete(order._id);
        const msg2 = await tiofyApp.messaging().sendEachForMulticast({
          tokens: [riderRejected.userDeviceToken],
          notification: {
            title: 'Order Cancelled 😔',
            body: 'We’re really sorry! We couldn’t find a rider for your Food Items. Please consider this order as cancelled and try again soon.',
            imageUrl: 'https://res.cloudinary.com/teepublic/image/private/s--iHow91xW--/t_Resized%20Artwork/c_fit,g_north_west,h_954,w_954/co_000000,e_outline:48/co_000000,e_outline:inner_fill:48/co_ffffff,e_outline:48/co_ffffff,e_outline:inner_fill:48/co_bbbbbb,e_outline:3:1000/c_mpad,g_center,h_1260,w_1260/b_rgb:eeeeee/c_limit,f_auto,h_630,q_90,w_630/v1564514493/production/designs/5462333_0.jpg',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg2.responses[0].error);
        const cancelledOrder = await FoodyCancelledOrders.create({
          user: new mongoose.Types.ObjectId(riderRejected.userId),
          restaurant: new mongoose.Types.ObjectId(riderRejected.restaurantId),
          orderedFromLocation: riderRejected.userAddress,
          bill: riderRejected.bill,
          items: riderRejected.foodItems,
          restroEarning: riderRejected.restroEarning,
          orderStatus: "Cancelled",
          reason: 'No riders available for delivery'
        })

        if (!cancelledOrder) {
          throw new ApiError(400, 'Error in creating cancelled Order')
        }

        return;
      }

      // Send a notification to the nearest rider
      const msg = await tiofyRiderApp.messaging().sendEachForMulticast({
        tokens: [nearestRider.deviceToken],
        notification: {
          title: 'You Received an Order From Foody',
          body: 'A user placed an order, please respond quickly',  // Add food items details also
          imageUrl: 'https://th.bing.com/th/id/OIP.I4OyONg5cqmX2UCXn27H2QHaHa?rs=1&pid=ImgDetMain',
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
        restroDeviceToken: riderRejected.restroDeviceToken,
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
        if (!updatedRiderOrder?.status) {
          console.log(`Rider ${newRiderOrder.riderId} did not respond to the order within 90 seconds.`);
          await RiderAcceptReject.findByIdAndDelete(newRiderOrder._id);

          // Recursively find another nearest rider if the current rider didn't respond
          await findAndNotifyRider([...excludedRiderIds, nearestRider._id, newRiderOrder.riderId]);
        }
      }, 90000);
    };

    // Start the process of finding and notifying a rider
    await findAndNotifyRider([riderRejected.riderId]);
  });

  socket.on("RiderCurrentLocation", async (data) => {
    io.emit("CurrentLocationofRiderToUser", data)
  })

  /************************************ CYR RIDES SOCKETS ***********************************/

  socket.on("CyrRidePlaced", async (data) => {
    console.log("Server data", data);

    const findAndNotifyRider = async (ridersList) => {
      let nearestRider = null;
      let minDistance = Infinity;

      ridersList.forEach(rider => {
        const distance = haversine(data.pickupLocation.lat, data.pickupLocation.long, rider.latitude, rider.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          nearestRider = rider;
        }
      });

      if (!nearestRider) {
        const msg = await tiofyApp.messaging().sendEachForMulticast({
          tokens: [data.Userdata.deviceToken],
          notification: {
            title: 'Cancelled Ride',
            body: 'Sorry! We are unable to find any rider at the moment so please consider this ride as cancelled.',
            imageUrl: 'https://th.bing.com/th/id/OIP.I4OyONg5cqmX2UCXn27H2QHaHa?rs=1&pid=ImgDetMain',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg.responses[0].error);
      // return a socket also to user for this
      io.emit("NoRiderFoundForCYR", {userId: data.Userdata._id})
        return;
      }

      const msg2 = await tiofyRiderApp.messaging().sendEachForMulticast({
        tokens: [nearestRider.deviceToken],
        notification: {
          title: 'New Ride from CYR!',
          body: 'A user just placed an order. Get ready to give them a hillarious and safe ride!',
          imageUrl: 'https://img.freepik.com/premium-photo/middleaged-food-delivery-rider-action_895561-5174.jpg',
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
        userDeviceToken: data.Userdata.deviceToken,
        userId: data.Userdata._id,
        bill: data.bill,
        riderEarning: data.bill,
        distance: data.bill/10,
        city: data.pickupLocation.city,
        fromLocation: data.pickupLocation,
        toLocation: data.dropLocation,
        orderOf: 'Cyr',
        otp: data.otp,
        vehicleType: data.selectedVehicleType
      });

      if (!riderOrder) {
        throw new ApiError(400, "Error in Creating of Accept/Reject");
      }

      // io.emit("RiderOrderInform", {
      //   data,
      //   restaurantId: restro.restaurantId,
      //   riderId: riderOrder.riderId,
      //   restroEarning: data.restroBill,
      //   riderEarning: data.riderEarning
      // }); // this was just for fast, as data is also stored in accept/reject so dont need this

      // Start timeout for rider response
      setTimeout(async () => {
        const updatedRiderOrder = await RiderAcceptReject.findById(riderOrder._id);
        if (!updatedRiderOrder?.status) {
          console.log(`Rider ${riderOrder.riderId} did not respond to the order within 90 seconds.`);
          await RiderAcceptReject.findByIdAndDelete(riderOrder._id);

          // Exclude the non-responsive rider and try again
          const remainingRiders = ridersList.filter(rider => rider._id.toString() !== riderOrder.riderId.toString());
          findAndNotifyRider(remainingRiders); // Recursive call to handle the next rider
        }
      }, 90000);
    };

    findAndNotifyRider(data.riders);
  })

  socket.on("RiderAcceptedCyrOrder", async (data) => {

    const rider = await RiderAcceptReject.findByIdAndUpdate(
      data.orderId,
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
        title: 'Get Ready for a ride!',
        body: 'Your rider just accepted the ride!',  
        imageUrl: 'https://img.freepik.com/premium-photo/middleaged-food-delivery-rider-action_895561-5174.jpg',
      },
      android: {
        notification: {
          channelId: "order_channel", // Specify your Android notification channel ID
          sound: "order_tone.mp3", // Specify your custom sound file
        },
      },
    });
    console.log("Message", msg);

    const order = await CYROrders.create({
         bookedBy: data.userId,
         rider: rider.riderId,
         fromLocation: rider.fromLocation,
         toLocation: rider.toLocation,
         bill: rider.bill,
         distance: rider.distance,
         otp: data.otp
    })

    if (!order) {
      throw new ApiError(400, "Error in creating order")
    }

    io.emit('CyrRideAcceptedbyRider', { orderId: order._id, userId: data.userId })

    const riderOrder = await Rider.findByIdAndUpdate(
      rider.riderId,
      {
        $push: {
          cyrRideHistory: new mongoose.Types.ObjectId(order._id)
        }
      },
      {
        new: true
      })

    if (!riderOrder) {
      throw new ApiError(400, "Error in adding order history")
    }

    const userOrder = await User.findByIdAndUpdate(
      rider.userId,
      {
        $push: {
          cyrOrderHistory: new mongoose.Types.ObjectId(order._id)
        }
      },
      {
        new: true
      })

    if (!userOrder) {
      throw new ApiError(400, "Error in adding Users order history")
    }

  })

  socket.on("RiderRejectedCyrOrder", async (data) => {
    // Delete the rejected rider's data from RiderAcceptReject
    const riderRejected = await RiderAcceptReject.findByIdAndDelete(data.orderId);

    if (!riderRejected) {
      throw new ApiError(400, "Error in Deleting Accept/Reject");
    }

    // Function to handle finding a new rider
    const findAndNotifyRider = async (excludedRiderIds = []) => {
      // Find available riders in the city excluding the rejected ones
      const availableRiders = await Rider.find({
        city: data.city,
        availableStatus: true,
        vehicleType: data.vehicleType,
        _id: { $nin: excludedRiderIds } // Exclude previously rejected riders
      });

      if (availableRiders.length === 0) {
        console.log('No riders available .........', data.userId, riderRejected);
    
        const msg2 = await tiofyApp.messaging().sendEachForMulticast({
          tokens: [riderRejected.userDeviceToken],
          notification: {
            title: 'Ride Cancelled 😔',
            body: 'We’re really sorry! We couldn’t find a rider for your Destination.',
            imageUrl: 'https://res.cloudinary.com/teepublic/image/private/s--iHow91xW--/t_Resized%20Artwork/c_fit,g_north_west,h_954,w_954/co_000000,e_outline:48/co_000000,e_outline:inner_fill:48/co_ffffff,e_outline:48/co_ffffff,e_outline:inner_fill:48/co_bbbbbb,e_outline:3:1000/c_mpad,g_center,h_1260,w_1260/b_rgb:eeeeee/c_limit,f_auto,h_630,q_90,w_630/v1564514493/production/designs/5462333_0.jpg',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg2.responses[0].error);

        return;
      }

      // Calculate distance for each rider and find the nearest one
      let nearestRider = null;
      let minDistance = Infinity;

      for (const rider of availableRiders) {
        const { latitude: riderLat, longitude: riderLon } = rider;
        const distance = haversine(riderRejected.fromLocation.lat, riderRejected.long, riderLat, riderLon);
        if (distance < minDistance) {
          minDistance = distance;
          nearestRider = rider;
        }
      }

      if (!nearestRider) {
    
        const msg2 = await tiofyApp.messaging().sendEachForMulticast({
          tokens: [riderRejected.userDeviceToken],
          notification: {
            title: 'Order Cancelled 😔',
            body: 'We’re really sorry! We couldn’t find a rider for your Destination',
            imageUrl: 'https://res.cloudinary.com/teepublic/image/private/s--iHow91xW--/t_Resized%20Artwork/c_fit,g_north_west,h_954,w_954/co_000000,e_outline:48/co_000000,e_outline:inner_fill:48/co_ffffff,e_outline:48/co_ffffff,e_outline:inner_fill:48/co_bbbbbb,e_outline:3:1000/c_mpad,g_center,h_1260,w_1260/b_rgb:eeeeee/c_limit,f_auto,h_630,q_90,w_630/v1564514493/production/designs/5462333_0.jpg',
          },
          android: {
            notification: {
              channelId: "order_channel", // Specify your Android notification channel ID
              sound: "order_tone.mp3", // Specify your custom sound file
            },
          },
        });
        console.log("Message", msg2.responses[0].error);
        io.emit("NoRiderFoundForCYR", {userId: data.userId})
        return;
      }

      // Send a notification to the nearest rider
      const msg = await tiofyRiderApp.messaging().sendEachForMulticast({
        tokens: [nearestRider.deviceToken],
        notification: {
          title: 'You Received an Order From CYR',
          body: 'A user placed an order, please respond quickly',  // Add food items details also
          imageUrl: 'https://th.bing.com/th/id/OIP.I4OyONg5cqmX2UCXn27H2QHaHa?rs=1&pid=ImgDetMain',
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
        userDeviceToken: riderRejected.userDeviceToken,
        userId: riderRejected.userId,
        bill: riderRejected.bill,
        riderEarning: riderRejected.riderEarning,
        distance: riderRejected.distance,
        city: riderRejected.fcity,
        fromLocation: riderRejected.fromLocation,
        toLocation: riderRejected.toLocation,
        orderOf: 'Cyr',
        otp: riderRejected.otp,
        vehicleType: riderRejected.vehicleType
      });

      if (!newRiderOrder) {
        throw new ApiError(400, "Error in Creating Accept/Reject Entry");
      }

      // Start timeout for the new rider's response
      setTimeout(async () => {
        // Check if the new rider has responded within the timeout
        const updatedRiderOrder = await RiderAcceptReject.findById(newRiderOrder._id);
        if (!updatedRiderOrder?.status) {
          console.log(`Rider ${newRiderOrder.riderId} did not respond to the order within 90 seconds.`);
          await RiderAcceptReject.findByIdAndDelete(newRiderOrder._id);

          // Recursively find another nearest rider if the current rider didn't respond
          await findAndNotifyRider([...excludedRiderIds, nearestRider._id, newRiderOrder.riderId]);
        }
      }, 90000);
    };

    // Start the process of finding and notifying a rider
    await findAndNotifyRider([riderRejected.riderId]);
  });

  // Disconnect event
  socket.on('disconnect', async () => {
    console.log('User disconnected');
  })

};


export { handleConnection }