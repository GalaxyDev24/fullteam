
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('blocked_users').truncate()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('blocked_users').insert({user_id: 1, other_user_id: 3}),
        knex('blocked_users').insert({user_id: 1, other_user_id: 16}),
      ]);
    });
};
