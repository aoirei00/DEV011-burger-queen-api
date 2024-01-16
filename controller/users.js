const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { connect } = require('../connect');


// Función para construir el encabezado 'Link'
function buildLinkHeader(req, responseData) {
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
  const nextPageUrl = `${baseUrl}?page=${responseData.currentPage + 1}&_limit=${responseData.limit}`;
  const lastPageUrl = `${baseUrl}?page=${responseData.totalPages}&_limit=${responseData.limit}`;
  return `<${lastPageUrl}>; rel="last", <${nextPageUrl}>; rel="next"`;
}

module.exports = {
  /// Obtener lista de de todos los usuarios
  getUsers: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
  
      // Parámetros de paginación
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query._limit) || 10;

      // Realiza una consulta para obtener el total de usuarios
      const totalUsers = await usersCollection.countDocuments();

      // Calcula el índice de inicio y fin para la paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page === 1 ? limit : page * limit;

      const users = await usersCollection.find().skip(startIndex).limit(endIndex).toArray();

      // Construye la respuesta con información de paginación
      const responseData = {
        totalItems: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        users: users,  
        limit: limit,
      };

      // Imprimir valores para depuración
      console.log('Response:', responseData);

      // Generar el encabezado Link solo si hay más de una página
      if (responseData.totalPages > 1) {
        console.log('Generating Link Header...');
        const linkHeader = buildLinkHeader(req, responseData);
        // Imprimir valores para depuración
        console.log('Link Header:', linkHeader);
        resp.set('Link', linkHeader);
      }

      resp.json(responseData);
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
        objectId = user ? user._id : null; // Obtén el _id del usuario si se encontró por correo
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
    // Verificación de actualización de propiedades
      const updatedData = {};

      if (req.body.email !== undefined && req.body.email !== null) {
        updatedData.email = req.body.email;
      }

      if (req.body.password !== undefined && req.body.password !== null) {
        const hashedPassword = bcrypt.hashSync(req.body.password, 10);
        updatedData.password = hashedPassword;
      }

      if (req.body.roles !== undefined && req.body.roles !== null) {
      // Verificar si el usuario autenticado es un administrador
        if (req.userRole === 'admin') {
          updatedData.roles = req.body.roles;
        } else {
          console.log('No autorizado para cambiar roles');
          return resp.status(403).json({ error: 'No autorizado para cambiar roles' });
        }
      }

      if (req.body.roles) {
      // Verificar si el usuario autenticado es un administrador
        if (req.userRole === 'admin') {
          updatedData.roles = req.body.roles;
        } else {
          console.log('No autorizado para cambiar roles');
          return resp.status(403).json({ error: 'No autorizado para cambiar roles' });
        }
      }

      // Verifica que haya al menos una propiedad para actualizar
      if (Object.keys(updatedData).length === 0) {
        console.log('No hay propiedades para actualizar');
        return resp.status(400).json({ error: 'No hay propiedades para actualizar' });
      }
      // Realiza la actualización del usuario
      const result = await usersCollection.updateOne({ _id: objectId }, { $set: updatedData });

      if (result.modifiedCount === 1) {
        console.log('Usuario actualizado con éxito');
        resp.status(200).json({ message: 'Usuario actualizado con éxito' });
      } else {
        console.log('No se pudo actualizar el usuario');
        resp.status(500).json({ error: 'No se pudo actualizar el usuario' });
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

      let user, objectId;

      // Verifica si el parámetro es un ID válido
      if (ObjectId.isValid(userId)) {
        objectId = new ObjectId(userId);
        user = await usersCollection.findOne({ _id: objectId });
      } else {
        // Si no es un ID válido, asume que es un correo electrónico
        user = await usersCollection.findOne({ email: userId });
        objectId = user ? user._id : null; // Obtén el _id del usuario si se encontró por correo
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

      if (!user) {
        console.log('El usuario no existe');
        return resp.status(404).json({ error: 'El usuario no existe' });
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
