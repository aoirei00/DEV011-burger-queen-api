const { ObjectId } = require('mongodb');
const { connect } = require('../connect');

module.exports = {
  /// Obtener listade de todos los productos
  getProducts: async (req, resp, next) => {
    try {
      const db = await connect();
      const productsCollection = db.collection('products');
      
      // Parámetros de paginación
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query._limit) || 10;

      // Calcula el índice de inicio y fin para la paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const products = await productsCollection.find().skip(startIndex).limit(limit).toArray();
      // Construye la respuesta con información de paginación
      const response = {
        totalItems: products.length,
        totalPages: Math.ceil(products.length / limit),
        currentPage: page,
        products: products.slice(startIndex, endIndex),
      };
      console.log(response);
      resp.json(response);
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener la lista de productos' });
    }
  },
  /// Obtener pruducto por id
  getProductsid: async (req, resp, next) => {
    try {
      const db = await connect();
      const productsCollection = db.collection('products');
      const productId = req.params.productId;

      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(productId)) {
        console.log('ID de producto no válido');
        return resp.status(400).json({ error: 'ID de producto no válido' });
      }

      // Convierte el ID en ObjectId
      const objectId = new ObjectId(productId);

      // Encuentra el usuario por su ID
      const product = await productsCollection.findOne({ _id: objectId });

      if (!product) {
        console.log('El producto no existe');
        return resp.status(404).json({ error: 'El producto no existe' });
      }

      console.log(product);
      resp.json(product);
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener el producto' });
    }
  },

  /// Crear nuevos productos
  postProducts: async (req, resp, next) => {
    try {
      const db = await connect();
      const productsCollection = db.collection('products');
      const existingproduct = await productsCollection.findOne({ name: req.body.name });
      if (existingproduct) {
        console.log('El producto ya existe');
        return resp.status(400).json({ error: 'El producto ya existe' });
      }
      const newProduct = {
        name: req.body.name,
        price: req.body.price,
        image: req.body.image,
        type: req.body.type,
      };
      await productsCollection.insertOne(newProduct);
      console.log('Se agrego el producto con exito!!');
      resp.status(201).json(newProduct);
    } catch (error) {
      console.log('Error al agregar producto');
      resp.status(500).json({ error: 'Error al agregar un nuevo producto' });
    }
  },
  /// Actualiza o edita al producto
  updateProductsid: async (req, resp, next) => {
    try {
      const db = await connect();
      const productsCollection = db.collection('products');
      const productId = req.params.productId;

      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(productId)) {
        console.log('ID de producto no válido');
        return resp.status(400).json({ error: 'ID de producto no válido' });
      }

      // Convierte el ID en ObjectId
      const objectId = new ObjectId(productId);

      // Encuentra el producto por su ID
      const product = await productsCollection.findOne({ _id: objectId });

      if (!product) {
        console.log('El producto no existe');
        return resp.status(404).json({ error: 'El producto no existe' });
      }
      const updatedData = {
        name: req.body.name,
        price: req.body.price,
        image: req.body.image,
        type: req.body.type,
      };

      // Realiza la actualización del producto
      const result = await productsCollection.updateOne({ _id: objectId }, { $set: updatedData });

      if (result.modifiedCount === 1) {
        console.log('producto actualizado con éxito');
        resp.json({ message: 'producto actualizado con éxito' });
      } else {
        console.log('No se pudo actualizar el producto');
        resp.status(500).json({ error: 'No se pudo actualizar el producto' });
      }
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener el producto' });
    }
  },

  /// Elimina el producto
  deleteProductsid: async (req, resp, next) => {
    try {
      const db = await connect();
      const productsCollection = db.collection('products');
      const productId = req.params.productId;

      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(productId)) {
        console.log('ID de producto no válido');
        return resp.status(400).json({ error: 'ID de producto no válido' });
      }

      // Convierte el ID en ObjectId
      const objectId = new ObjectId(productId);

      // Encuentra el producto por su ID
      const product = await productsCollection.findOne({ _id: objectId });
      if (!product) {
        console.log('El producto no existe');
        return resp.status(404).json({ error: 'El producto no existe' });
      }

      await productsCollection.deleteOne({ _id: objectId });

      console.log('Producto eliminado con éxito');
      resp.status(200).json({ message: 'Producto eliminado con éxito' });
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al eliminar el Producto' });
    }
  },

};
