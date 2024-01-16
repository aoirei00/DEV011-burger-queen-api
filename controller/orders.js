const { ObjectId } = require('mongodb');
const { connect } = require('../connect');

module.exports = {
  /// Controlador para mostrar lista de las ordenes
  getOrders: async (req, resp, next) => {
    try {
      const db = await connect();
      const ordersCollection = db.collection('orders');

      // Parámetros de paginación
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query._limit) || 10;

      // Calcula el índice de inicio y fin para la paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      // Consulta la base de datos con límites de paginación
      const orders = await ordersCollection.find().skip(startIndex).limit(limit).toArray();

      // Construye la respuesta con información de paginación
      const response = {
        totalItems: orders.length,
        totalPages: Math.ceil(orders.length / limit),
        currentPage: page,
        orders: orders.slice(startIndex, endIndex),
      };
      console.log(response);
      resp.json(response);
    } catch (error) {
      console.error('Error al obtener las órdenes:', error);
      resp.status(500).json({ error: 'Error al obtener las órdenes' });
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
        return resp.status(404).json({ error: 'ID de orden no válido' });
      }
      // Convierte el ID en ObjectId
      const objectId = new ObjectId(orderId);

      // Encuentra la orden por su ID
      const order = await ordersCollection.findOne({ _id: objectId });

      if (!order) {
        console.log('La orden no existe');
        return resp.status(404).json({ error: 'La orden no existe' });
      }

      console.log(order);
      resp.json(order);
    } catch (error) {
      // Maneja errores aquí si es necesario
      console.error('Error al obtener la orden por ID:', error);
      resp.status(500).json({ error: 'Error al obtener la orden por ID' });
    }
  },

  /// Controlador para crear ordenes
  postOrders: async (req, resp, next) => {
    try {
      const db = await connect();
      const ordersCollection = db.collection('orders');

      // Extrae información necesaria del cuerpo de la solicitud
      const { userId, client, products, status, dateEntry } = req.body;

      // Verifica si el valor proporcionado es un ID de usuario válido
      let userIdObject;

      if (ObjectId.isValid(userId)) {
        userIdObject = new ObjectId(userId);
      } else {
      // Si no es un ID válido, intenta encontrar el usuario por correo electrónico
        const usersCollection = db.collection('users');
        const userByEmail = await usersCollection.findOne({ email: userId });

        if (!userByEmail) {
          console.log('Usuario no encontrado por correo electrónico');
          return resp.status(400).json({ error: 'Usuario no encontrado por correo electrónico' });
        }

        userIdObject = userByEmail._id;
      }

      // Verifica si el ID de usuario es válido después de la lógica adicional
      if (!userIdObject) {
        console.log('ID de usuario no válido');
        return resp.status(400).json({ error: 'ID de usuario no válido' });
      }


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
      resp.status(200).json(newOrder);
    } catch (error) {
      console.log('Error al agregar la orden');
      resp.status(500).json({ error: 'Error al agregar una nueva orden' });
    }
  },

  updateOrdersId: async (req, resp, next) => {
    try {
      const db = await connect();
      const ordersCollection = db.collection('orders');
      const productsCollection = db.collection('products');
      const orderId = req.params.orderId;
  
      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(orderId)) {
        console.log('ID de orden no válido');
        return resp.status(404).json({ error: 'ID de orden no válido' });
      }
  
      // Convierte el ID en ObjectId
      const objectId = new ObjectId(orderId);
  
      // Encuentra la orden por su ID
      const order = await ordersCollection.findOne({ _id: objectId });
  
      if (!order) {
        console.log('La orden no existe');
        return resp.status(404).json({ error: 'La orden no existe' });
      }
  
      // Extrae información necesaria del cuerpo de la solicitud
      const { userId, client, products } = req.body;
  
      // Verifica si el ID de usuario proporcionado es válido
      if (!ObjectId.isValid(userId)) {
        console.log('ID de usuario no válido');
        return resp.status(400).json({ error: 'ID de usuario no válido' });
      }
  
      // Convierte el ID de usuario en ObjectId
      const userIdObject = new ObjectId(userId);
  
      // Verifica y agrega los campos a actualizar
      const updatedData = {
        userId: userIdObject,
        client: client || order.client,
        status: req.body.status || order.status,
        dateEntry: req.body.dateEntry || order.dateEntry || new Date().toISOString(),
      };
  
      if (products !== undefined) {
        const productsData = [];
  
        // Verifica si los IDs de productos proporcionados son válidos
        const validProductIds = await Promise.all(products.map(async (product) => {
          if (!ObjectId.isValid(product.productId)) {
            console.log('ID de producto no válido');
            return false;
          }
  
          // Convierte el ID de producto en ObjectId
          const productIdObject = new ObjectId(product.productId);
  
          if (product.qty === 0) {
            // Caso 1: Eliminar un producto de la orden
            const result = await ordersCollection.updateOne(
              { _id: objectId },
              { $pull: { products: { productId: productIdObject } } }
            );
          } else {
            // Caso 2: Modificar la cantidad de un producto específico
            const productData = await productsCollection.findOne({ _id: productIdObject });
  
            if (!productData) {
              console.log('Producto no encontrado');
              return false;
            }
  
            // Crea un objeto para almacenar los campos actualizables del producto
            const updatedProductData = {};
  
            if (product.qty !== undefined) {
              updatedProductData.qty = product.qty;
            }
  
            // Agrega la información del producto actualizado al array
            productsData.push({
              qty: updatedProductData.qty || productData.qty,
              product: { ...productData, ...updatedProductData },
            });
          }
  
          return true;
        }));
  
        if (!validProductIds.every(Boolean)) {
          return resp.status(400).json({ error: 'ID de producto no válido' });
        }
  
        updatedData.products = productsData;
      }
  
      const result = await ordersCollection.updateOne({ _id: objectId }, { $set: updatedData });
  
      if (result.modifiedCount === 1) {
        console.log('La orden se actualizó con éxito');
        resp.json({ message: 'Orden actualizada con éxito' });
      } else {
        console.log('No se pudo actualizar la orden');
        resp.status(500).json({ error: 'No se pudo actualizar la orden' });
      }
    } catch (error) {
      console.log('Error al actualizar la orden');
      resp.status(500).json({ error: 'Error al actualizar la orden' });
    }
  },
  
  /// Controlador para eliminar ordenes 
  deleteOrdersId: async (req, resp, next) => {
    try {
      const db = await connect();
      const ordersCollection = db.collection('orders');
      const orderId = req.params.orderId;
  
      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(orderId)) {
        console.log('ID de orden no válido');
        return resp.status(404).json({ error: 'ID de orden no válido' });
      }

      // Convierte el ID en ObjectId
      const objectId = new ObjectId(orderId);
  
      // Encuentra la orden por su ID
      const order = await ordersCollection.findOne({ _id: objectId });
  
      if (!order) {
        console.log('La orden no existe');
        return resp.status(404).json({ error: 'La orden no existe' });
      }
  
      // Elimina la orden por su ID
      await ordersCollection.deleteOne({ _id: objectId });
  
      console.log('Orden eliminada con éxito');
      resp.status(200).json({ message: 'Orden eliminada con éxito' });
    } catch (error) {
      // Manejo de errores
      console.error('Error al obtener/eliminar la orden por ID:', error);
      resp.status(500).json({ error: 'Error al obtener/eliminar la orden por ID' });
    }
  },
  
};
