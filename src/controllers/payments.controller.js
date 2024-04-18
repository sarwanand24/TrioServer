// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
import Stripe from 'stripe';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const stripe = new Stripe('sk_test_51P562USCfSZTgwMiVqPaGC2SuaqSmucgePKCWkNAaOAfSPL7d54Hsuxk4ZghXpePtOw5PIREkLsuYGfspaq55ZCj001xGPnU95', {
    apiVersion: '2023-10-16', // Adjust the API version as needed
  });

const depositAmount = asyncHandler(async (req, res) => {
 // Use an existing Customer ID if this is a returning customer.
   const {amount} = req.body;
 const customer = await stripe.customers.create();

  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: '2023-10-16'},
  );
  console.log("ephemeralKeyLog", ephemeralKey.secret);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 100*(amount),
    currency: 'INR',
    payment_method_types: ['card']
  });
  console.log("PaymentIntentLog", paymentIntent.client_secret);

return res
.status(200)
.json(new ApiResponse(200,{  
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id},
    "Success from Backend Res"
))
})


export {
    depositAmount
}
