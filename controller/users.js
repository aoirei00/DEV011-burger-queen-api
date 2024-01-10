const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { connect } = require('../connect');

module.exports = {
  /// Obtener listade de todos los usuarios
  getUsers: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
  
      // Parámetros de paginación
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query._limit) || 10;
  
      // Calcula el índice de inicio y fin para la paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
  
      const users = await usersCollection.find().skip(startIndex).limit(endIndex).toArray();
      // Construye la respuesta con información de paginación
      const response = {
        totalItems: users.length,
        totalPages: Math.ceil(users.length / limit),
        currentPage: page,
        users: users.slice(startIndex, endIndex),  
      };
      console.log(response);
      resp.json(response);
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener la lista de usuarios' });
    }
  },
  /// Obtener usuario por id
  getUsersUid: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const userId = req.params.uid;
      let user;

      // Verifica si el parámetro es un ID válido
      if (ObjectId.isValid(userId)) {
        const objectId = new ObjectId(userId);
        user = await usersCollection.findOne({ _id: objectId });
      } else {
        // Si no es un ID válido, asume que es un correo electrónico
        user = await usersCollection.findOne({ email: userId });
      }

      if (!user) {
        console.log('El usuario no existe');
        return resp.status(404).json({ error: 'El usuario no existe' });
      }
      // Verificar si el usuario autenticado es el propietario o un administrador
      const authenticatedUserId = req.userId ? req.userId.toString() : null;
      if (authenticatedUserId !== user._id.toString() && req.userRole !== 'admin') {
        console.log('No autorizado');
        return resp.status(403).json({ error: 'No autorizado' });
      }

      console.log(user);
      resp.json(user);
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener el usuario' });
    }
  },

  /// Crear nuevos usuarios
  postUsers: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      // Validar si el usuario ya existe
      const existingUser = await usersCollection.findOne({ email: req.body.email });
      if (existingUser) {
        console.log('El usuario ya existe');
        return resp.status(403).json({ error: 'El usuario ya existe' });
      }
      // Validar si el email y la contraseña están presentes en la solicitud
      if (!req.body.email || !req.body.password) {
        console.log('Email y contraseña son obligatorios');
        return resp.status(400).json({ error: 'Email y contraseña son obligatorios' });
      }

      // Validar la longitud de la contraseña
      if (req.body.password.length < 6) {
        console.log('La contraseña debe tener al menos 6 caracteres');
        return resp.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      // Verifica si el email es válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        console.log('Email no válido');
        return resp.status(400).json({ error: 'Email no válido' });
      }

      if (!req.body.password) {
        console.log('Contraseña es obligatoria');
        return resp.status(400).json({ error: 'Contraseña es obligatoria' });
      }
  
      const hashedPassword = bcrypt.hashSync(req.body.password, 10);

      const newUser = {
        email: req.body.email,
        password: hashedPassword,
        roles: req.body.roles,
      };
      await usersCollection.insertOne(newUser);
      delete newUser.password;
      console.log('Se agrego el usuario con exito!!');
      resp.status(200).json(newUser);
    } catch (error) {
      console.log('Error al agregar usuario', error);
      resp.status(500).json({ error: 'Error al agregar un nuevo usuario' });
    }
  },
  /// Actualiza o edita al usuario
  updateUsersUid: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const userId = req.params.uid;

      let user, objectId;

      // Verifica si el parámetro es un ID válido
      if (ObjectId.isValid(userId)) {
        objectId = new ObjectId(userId);
        user = await usersCollection.findOne({ _id: objectId });
      } else {
        // Si no es un ID válido, asume que es un correo electrónico
        user = await usersCollection.findOne({ email: userId });
      }

      if (!user) {
        console.log('El usuario no existe');
        return resp.status(404).json({ error: 'El usuario no existe' });
      }
      // Verificar si el usuario autenticado es el propietario o un administrador
      const authenticatedUserId = req.userId ? req.userId.toString() : null;
      console.log('Authenticated User ID:', authenticatedUserId);
      console.log('User ID from request:', req.params.uid);
      console.log('User Role:', req.userRole);
      if (authenticatedUserId !== user._id.toString() && req.userRole !== 'admin') {
        console.log('No autorizado');
        return resp.status(403).json({ error: 'No autorizado' });
      }
      // Verificación de actualización de propiedades
      if (!req.body.email && !req.body.password && !req.body.roles) {
        console.log('No hay propiedades para actualizar');
        return resp.status(400).json({ error: 'No hay propiedades para actualizar' });
      }
      if (!req.body.password) {
        console.log('Contraseña es obligatoria');
        return resp.status(400).json({ error: 'Contraseña es obligatoria' });
      }
      const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  
      const updatedData = {
        email: req.body.email,
        password: hashedPassword,
        roles: req.body.roles,
      };

      // Realiza la actualización del usuario
      if (req.userRole === 'admin') {
        const result = await usersCollection.updateOne({ _id: objectId }, { $set: updatedData });
        delete updatedData.password;

        if (result.modifiedCount === 1) {
          console.log('Usuario actualizado con éxito');
          resp.status(200).json({ message: 'Usuario actualizado con éxito' });
        } else {
          console.log('No se pudo actualizar el usuario');
          resp.status(500).json({ error: 'No se pudo actualizar el usuario' });
        }
      } else {
        console.log('No autorizado para cambiar roles');
        resp.status(403).json({ error: 'No autorizado para cambiar roles' });
      }
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  },

  /// Elimina el usuario
  deleteUsersUid: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const userId = req.params.uid;

      let user;

      // Verifica si el parámetro es un ID válido
      if (ObjectId.isValid(userId)) {
        const objectId = new ObjectId(userId);
        user = await usersCollection.findOne({ _id: objectId });
      } else {
        // Si no es un ID válido, asume que es un correo electrónico
        user = await usersCollection.findOne({ email: userId });
      }

      if (!user) {
        console.log('El usuario no existe');
        return resp.status(404).json({ error: 'El usuario no existe' });
      }
      // Verificar si el usuario autenticado es el propietario o un administrador
      const authenticatedUserId = req.userId ? req.userId.toString() : null;
      if (
        authenticatedUserId !== user._id.toString() &&
        (req.userRole !== 'admin' || authenticatedUserId !== user._id.toString())
      ) {
        console.log('No autorizado');
        return resp.status(403).json({ error: 'No autorizado' });
      }

      await usersCollection.deleteOne({ _id: objectId });

      console.log('Usuario eliminado con éxito');
      resp.status(200).json({ message: 'Usuario eliminado con éxito' });
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al eliminar el usuario' });
    }
  },

};
