

import Stripe from 'stripe';

const secretKey = 'sk_test_51N6z0WCSqEAeQmco5oYdduocrsMEG55iW5qXyz9rB9X0MAFUM7mgZlKN0jeGemUJrIIYlAentHB2P9UDSUisLRrF00tMByKHA3'; // Replace 'API Key' with your actual Stripe secret key

const stripe = new Stripe(secretKey);


const CreatePayment = () =>{

const paymentIntent = stripe.paymentIntents.create({
  amount: 1000,
  currency: 'USD',
  customer: "cus_P2ieegpujLxg7f", // Make sure customerId is defined before using it
});

paymentIntent
  .then(function (response) {
    console.log("Payment Successful", response);
  })
  .catch(function (error) {
    console.error("Payment Error", error);
    // There was an error processing the payment.
  });

}

const StripeController = {
    CreatePayment,
 
  };
  
  export default StripeController;