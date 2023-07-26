
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('game_invites').truncate()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
          knex('game_invites').insert({game_id: 1, user_id: 1, time: 123123123123123}),
          knex('game_invites').insert({game_id: 2, user_id: 2, time: 123123123123123}),
      ]);
    });
};
