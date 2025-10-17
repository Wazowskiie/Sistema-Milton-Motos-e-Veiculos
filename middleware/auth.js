// middleware/auth.js
module.exports = (req, _res, next) => {
  // Se alguma rota usa req.user, deixe um usuário fake:
  req.user = req.user || { id: 'dev', email: 'dev@local' };
  next();
};