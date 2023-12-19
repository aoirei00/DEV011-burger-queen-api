const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const {
  getProducts,
  getProductsid,
  postProducts,
  updateProductsid,
  deleteProductsid,
} = require('../controller/products');

module.exports = (app, nextMain) => {
  app.get('/products', requireAuth, getProducts, (req, resp, next) => {
    // resp.json({ msg: ' OK ' });
  });

  app.get('/products/:productId', requireAuth, getProductsid, (req, resp, next) => {
  });

  app.post('/products', requireAdmin, postProducts, (req, resp, next) => {
  });

  app.put('/products/:productId', requireAdmin, updateProductsid, (req, resp, next) => {
  });

  app.delete('/products/:productId', requireAdmin, deleteProductsid, (req, resp, next) => {
  });

  nextMain();
};
