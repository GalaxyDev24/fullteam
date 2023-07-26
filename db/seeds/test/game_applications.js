
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('game_applications').truncate()
    .then(function () {
      return Promise.all([
          knex('game_applications').insert({user_id: 3, game_id: 1, time: 123123123123})
      ]);
    });
};
