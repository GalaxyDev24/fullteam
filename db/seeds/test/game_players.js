
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('game_players').truncate()
    .then(function () {
      return Promise.all([
        knex('game_players').insert({game_id: 1, user_id: 2, position: 0}),
        knex('game_players').insert({game_id: 3, user_id: 1, position: 0}),
        knex('game_players').insert({game_id: 3, user_id: 2, position: 1}),
        knex('game_players').insert({game_id: 3, user_id: 3, position: 2}),
      ]);
    });
};
