const {
  requireAuth,
} = require('../middleware/auth');

const {
  getOrders,
  getOrdersId,
  postOrders,
  updateOrdersId,
  deleteOrdersId,
} = require('../controller/orders');

module.exports = (app, nextMain) => {
  app.get('/orders', requireAuth, getOrders, (req, resp, next) => {
  });

  app.get('/orders/:orderId', requireAuth, getOrdersId, (req, resp, next) => {
  });

  app.post('/orders', requireAuth, postOrders, (req, resp, next) => {
  });

  app.put('/orders/:orderId', requireAuth, updateOrdersId, (req, resp, next) => {
  });

  app.delete('/orders/:orderId', requireAuth, deleteOrdersId, (req, resp, next) => {
  });

  nextMain();
};
