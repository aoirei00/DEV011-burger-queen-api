const { ObjectId } = require('mongodb');
const { connect } = require('../connect');

module.exports = {
  /// Controlador para mostrar lista de las ordenes
  getOrders: async (req, resp, next) => {
    try {
      const db = await connect();
      const ordersCollection = db.collection('orders');
      const orders = await ordersCollection.find().toArray();
      console.log(orders);
      resp.json(orders);
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener la lista de ordenes' });
    }
  },
  /// Controlador para buscar orden por id
  getOrdersId: async (req, resp, next) => {
    try {
      const db = await connect();
      const ordersCollection = db.collection('orders');
      const orderId = req.params.orderId;

      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(orderId)) {
        console.log('ID de orden no válido');
        return resp.status(400).json({ error: 'ID de orden no válido' });
      }
      // Convierte el ID en ObjectId
      const objectId = new ObjectId(orderId);

      // Encuentra la orden por su ID
      const order = await ordersCollection.findOne({ _id: objectId });

      if (!order) {
        console.log('La orden no existe');
        return resp.status(404).json({ error: 'La orden  no existe' });
      }
      const modifiedProducts = order.products.map(product => ({
        qty: product.qty,
        product: product.product || {}, // Si product.product es null, asigna un objeto vacío
      }));
  
      // Modifica la orden para usar la nueva estructura de products
      const modifiedOrder = { ...order, products: modifiedProducts };
  
      console.log(modifiedOrder);
      resp.json(modifiedOrder);

      console.log(order);
      resp.json(order);
    } catch (error) {

    }
  },

  /// Controlador para crear ordenes
  postOrders: async (req, resp, next) => {
    try {
      const db = await connect();
      const ordersCollection = db.collection('orders');

      // Extrae información necesaria del cuerpo de la solicitud
      const { userId, client, products } = req.body;

      // Verifica si el ID de usuario proporcionado es válido
      if (!ObjectId.isValid(userId)) {
        console.log('ID de usuario no válido');
        return resp.status(400).json({ error: 'ID de usuario no válido' });
      }

      // Convierte el ID de usuario en ObjectId
      const userIdObject = new ObjectId(userId);

      // Obtén información de los productos desde la colección de productos
      const productsCollection = db.collection('products');
      const productsData = [];

      // Verifica si los IDs de productos proporcionados son válidos
      const validProductIds = await Promise.all(products.map(async (product) => {
        if (!ObjectId.isValid(product.productId)) {
          console.log('ID de producto no válido');
          return false;
        }

        // Convierte el ID de producto en ObjectId
        const productIdObject = new ObjectId(product.productId);

        // Verifica si el producto existe y agrega la información al array
        const productData = await productsCollection.findOne({ _id: productIdObject });

        if (!productData) {
          console.log('Producto no encontrado');
          return false;
        }

        productsData.push({
          qty: product.qty,
          product: { ...productData },
        });

        return true;
      }));

      if (!validProductIds.every(Boolean)) {
        return resp.status(400).json({ error: 'ID de producto no válido' });
      }
      // estructura del esquema
      const newOrder = {
        userId: userIdObject,
        client: req.body.client,
        products: productsData,
        status: req.body.status,
        dateEntry: req.body.dateEntry || new Date().toISOString(), // para agregar la fecha
      };
      console.log('New Order:', newOrder);
      await ordersCollection.insertOne(newOrder);
      console.log('Se agregó la orden con éxito!!');
      resp.status(201).json(newOrder);
    } catch (error) {
      console.log('Error al agregar la orden');
      resp.status(500).json({ error: 'Error al agregar una nueva orden' });
    }
  },

};
