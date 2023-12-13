const { connect } = require('../connect');

module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const users = usersCollection.find().toArray();

      resp.json(users);
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener la lista de usuarios' });
    }

    // TODO: Implement the necessary function to fetch the `users` collection or table
  },
};
