const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { connect } = require('../connect');

module.exports = {
  /// Obtener listade de todos los usuarios
  getUsers: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const users = await usersCollection.find().toArray();

      console.log(users);
      resp.json(users);
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

      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(userId)) {
        console.log('ID de usuario no válido');
        return resp.status(400).json({ error: 'ID de usuario no válido' });
      }

      // Convierte el ID en ObjectId
      const objectId = new ObjectId(userId);

      // Encuentra el usuario por su ID
      const user = await usersCollection.findOne({ _id: objectId });

      if (!user) {
        console.log('El usuario no existe');
        return resp.status(404).json({ error: 'El usuario no existe' });
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
      const existingUser = await usersCollection.findOne({ email: req.body.email });
      if (existingUser) {
        console.log('El usuario ya existe');
        return resp.status(400).json({ error: 'El usuario ya existe' });
      }
      const newUser = {
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        roles: req.body.roles,
      };
      await usersCollection.insertOne(newUser);
      console.log('Se agrego el usuario con exito!!');
      resp.status(201).json(newUser);
    } catch (error) {
      console.log('Error al agregar usuario');
      resp.status(500).json({ error: 'Error al agregar un nuevo usuario' });
    }
  },
  /// Actualiza o edita al usuario
  updateUsersUid: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const userId = req.params.uid;

      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(userId)) {
        console.log('ID de usuario no válido');
        return resp.status(400).json({ error: 'ID de usuario no válido' });
      }

      // Convierte el ID en ObjectId
      const objectId = new ObjectId(userId);

      // Encuentra el usuario por su ID
      const user = await usersCollection.findOne({ _id: objectId });

      if (!user) {
        console.log('El usuario no existe');
        return resp.status(404).json({ error: 'El usuario no existe' });
      }
      const updatedData = {
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        roles: req.body.roles,
      };

      // Realiza la actualización del usuario
      const result = await usersCollection.updateOne({ _id: objectId }, { $set: updatedData });

      if (result.modifiedCount === 1) {
        console.log('Usuario actualizado con éxito');
        resp.json({ message: 'Usuario actualizado con éxito' });
      } else {
        console.log('No se pudo actualizar el usuario');
        resp.status(500).json({ error: 'No se pudo actualizar el usuario' });
      }
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener el usuario' });
    }
  },

  /// Elimina el usuario
  deleteUsersUid: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const userId = req.params.uid;

      // Verifica si el ID proporcionado es válido
      if (!ObjectId.isValid(userId)) {
        console.log('ID de usuario no válido');
        return resp.status(400).json({ error: 'ID de usuario no válido' });
      }

      // Convierte el ID en ObjectId
      const objectId = new ObjectId(userId);

      // Encuentra el usuario por su ID
      const user = await usersCollection.findOne({ _id: objectId });

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
