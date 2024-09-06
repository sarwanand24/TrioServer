import Razorpay from 'razorpay';
import { asyncHandler } from '../utils/asyncHandler.js';
import crypto from 'crypto';

var instance = new Razorpay({ key_id: 'rzp_test_TLbKsNVqgyyLdp', key_secret: 'FvLlb5ZvXmZAoESKXvGdKnaH' })

const payments = asyncHandler( async(req, res) => {
  const { amount } = req.body; // Get amount from the frontend
  const receipt = `receipt_${Math.floor(Math.random() * 1000000)}`; // Generate a unique receipt

  const options = {
    "amount": amount,
    "currency": 'INR',
    "receipt": receipt, // Dynamically generated receipt
    "partial_payment": false
  };

  try {
    const order = await instance.orders.create(options); // Create the order
    res.json(order); // Send the created order as a response
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

const verification = asyncHandler( async(req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body; // Data received from the frontend after successful payment

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  // Create the expected signature using the order ID and payment ID
  const expectedSignature = crypto
    .createHmac('sha256', 'FvLlb5ZvXmZAoESKXvGdKnaH') // Use your Razorpay Key Secret
    .update(body.toString())
    .digest('hex');
  // Check if the generated signature matches the signature sent from Razorpay
  if (expectedSignature === razorpay_signature) {
    res.send({ success: true }); // Payment is verified successfully
  } else {
    res.status(400).send({ success: false }); // Payment verification failed
  }
})

export {
  payments,
  verification
}