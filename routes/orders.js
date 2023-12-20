const {
  requireAuth,
} = require('../middleware/auth');

const {
  getOrders,
  getOrdersId,
  postOrders,
  //updateProductsUid,
  //deleteProductsUid,
} = require('../controller/orders');

module.exports = (app, nextMain) => {
  app.get('/orders', requireAuth, getOrders, (req, resp, next) => {
  });

  app.get('/orders/:orderId', requireAuth, getOrdersId, (req, resp, next) => {
  });

  app.post('/orders', requireAuth, postOrders, (req, resp, next) => {
  });

  app.put('/orders/:orderId', requireAuth, (req, resp, next) => {
  });

  app.delete('/orders/:orderId', requireAuth, (req, resp, next) => {
  });

  nextMain();
};
