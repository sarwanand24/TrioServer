import Razorpay from 'razorpay';
import { asyncHandler } from '../utils/asyncHandler.js';
import crypto from 'crypto';

var instance = new Razorpay({ key_id: 'rzp_test_TLbKsNVqgyyLdp', key_secret: 'FvLlb5ZvXmZAoESKXvGdKnaH' })

const payments = asyncHandler( async(req, res) => {
  const { amount } = req.body;

  // Validate amount (amount should be in paise for Razorpay)
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount provided' });
  }

  // Generate a unique receipt ID
  const receipt = `receipt_${Math.floor(Math.random() * 1000000)}`;

  try {
   console.log('checking', amount, receipt);
    const order = await instance.orders.create({
      "amount": amount * 100,
      "currency": "INR",
      "receipt": receipt,
      "partial_payment": false,
     })

    // Check if the order was created successfully
    if (!order) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Log the order for debugging
    console.log('Order Created: ', order);

    // Send the created order back to the frontend
    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating Razorpay order: ', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
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