var knex = require('lib/knex');
var q = require('q');

/** Checks 2 user IDs to see if they're blocked. Returns a promise
which will resolve to either true or false, or be rejected if a
database error occurred. */
function isUserBlocked(id1, id2) {
  var deferred = q.defer();

  knex('blocked_users')
    .select(['user_id', 'other_user_id'])
    /*.where({
      'user_id': id1,
      'other_user_id': id2})
    .or.where({
      'user_id': id1,
      'other_user_id': id2})*/
    .whereRaw('(user_id = ? and other_user_id = ?) OR (user_id = ? and other_user_id = ?)', [id1, id2, id2, id1])
    .then(function(results) {
      if (results.length === 0) {
        deferred.resolve(false);
      }
      deferred.resolve(true);
    })
    .catch(function(err) {
      deferred.reject(err);
    });
  return deferred.promise;
}

module.exports = {
  isUserBlocked: isUserBlocked
}
