const jwt = require('jsonwebtoken');

console.log('Middleware de autenticación en ejecución.');
module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      return next(403);
    }
    const userId = decodedToken.uid;

    if (!userId) {
      return next(403);
    }

    req.userId = userId;

    console.log('Usuario autenticado:', userId);

    // Enviar una respuesta al cliente con el userId
    return resp.status(200).json({ userId });
    
  });

  // TODO: Verify user identity using `decodeToken.uid`
};

module.exports.isAuthenticated = (req) => (
  // TODO: Decide based on the request information whether the user is authenticated
  
);

module.exports.isAdmin = (req) => (
  // TODO: Decide based on the request information whether the user is an admin
  false
);

module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
