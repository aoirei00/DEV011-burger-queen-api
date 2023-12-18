const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const {
  getProducts,
  getProductsUid,
  postProducts,
  updateProductsUid,
  deleteProductsUid,
} = require('../controller/products');

module.exports = (app, nextMain) => {
  app.get('/products', requireAuth, getProducts, (req, resp, next) => {
    // resp.json({ msg: ' OK ' });
  });

  app.get('/products/:productId', requireAuth, getProductsUid, (req, resp, next) => {
  });

  app.post('/products', requireAdmin, postProducts, (req, resp, next) => {
  });

  app.put('/products/:productId', requireAdmin, updateProductsUid, (req, resp, next) => {
  });

  app.delete('/products/:productId', requireAdmin, deleteProductsUid, (req, resp, next) => {
  });

  nextMain();
};
