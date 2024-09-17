let payment_request_event;
let resolver;
let client

if (typeof self !== 'undefined') {
  // `self` is the global object in service worker
  self.addEventListener('paymentrequest', async e => {
    if (payment_request_event) {
      // If there's an ongoing payment transaction, reject it.
      resolver.reject();
    }
    // Preserve the event for future use
    payment_request_event = e;

    // Retain a promise for future resolution
    // Polyfill for PromiseResolver is provided below.
    resolver = new PromiseResolver();

    // Pass a promise that resolves when payment is done.
    e.respondWith(resolver.promise);
    // Open the checkout page.
    try {
      // Open the window and preserve the client
      client = await e.openWindow('https://sandbox.pablosfor.ar/pay/provider/payoptions.html');
      // client = await e.openWindow('https://www.mercadopago.com.ar/checkout/v1/payment/redirect/?preference-id=239658604-6e171711-54b4-4dcc-b64f-b5a74e4ca0ed&device-override=desktop&router-request-id=45823c3d-e526-4426-a531-f53e9311a830');

      if (!client) {
        // Reject if the window fails to open
        throw 'Failed to open window';
      }
    } catch (err) {
      // Reject the promise on failure
      resolver.reject(err);
    };
  });

  class PromiseResolver {
    constructor() {
      this.promise_ = new Promise((resolve, reject) => {
        this.resolve_ = resolve;
        this.reject_ = reject;
      })
    }
    get promise() { return this.promise_ }
    get resolve() { return this.resolve_ }
    get reject() { return this.reject_ }
  }


  // Received a message from the frontend
  self.addEventListener('message', async e => {
    let details;
    try {
      switch (e.data.type) {
        // `WINDOW_IS_READY` is a frontend's ready state signal
        case 'WINDOW_IS_READY':
          console.log('Window is ready event received');
          // Pass the payment details to the frontend
          client.postMessage({
            type: 'PAYMENT_IS_READY',
            event: JSON.stringify(payment_request_event)
          });
          break;

        case 'AUTHENTICATED':
          console.log('Authenticated event received');
          // Pass the payment details to the frontend
          resolver.resolve({
            methodName: 'https://beta.mercadopago.com/fido/pay/init',
            details: {
              transactionId: '1234567',
              token: e.data.token,
            }
          });
          break;
      };
    } catch (err) {
      // Reject the promise on failure
      console.error(err);

    }
  });
}

