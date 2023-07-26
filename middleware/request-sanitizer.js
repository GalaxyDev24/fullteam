module.exports = function (req, res, next) {
  req.connection = { key: null };
  req.data = req.method === 'POST' ? req.body : req.query;
  next();
};