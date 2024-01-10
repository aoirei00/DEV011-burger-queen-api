const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
const { connect } = require('../connect');

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post('/login', async (req, resp, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(400);
      }
      const db = await connect();
      const usersCollection = db.collection('users');

      const userExists = await usersCollection.findOne({ email });
      if (!userExists) {
        return next(401);
      }
      const isEqual = await bcrypt.compare(password, userExists.password);
      if (isEqual) {
        // jtw.sign para crear el token.
        const accessToken = jwt.sign({ uid: userExists._id, email: userExists.email, role: userExists.roles }, secret, { expiresIn: '1h' });
        console.log("pass valido:", accessToken);
        resp.json({ token: accessToken });
      } else {
        console.log("pass invalido");
        resp.status(401).json({ error: 'Credenciales Invalidas' });
      }
      //next();
    } catch (error) {
      console.error('Error durante authentication:', error);
      resp.status(500).json({ error: 'Error Iterno de Servidor' });
    }

    // TODO: Authenticate the user
    // It is necessary to confirm if the email and password
    // match a user in the database
    // If they match, send an access token created with JWT
  });

  return nextMain();
};
