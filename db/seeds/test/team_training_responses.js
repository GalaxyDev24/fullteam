
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('team_training_responses').truncate()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('team_training_responses').insert({
          training_id: 1,
          user_id: 1,
        }),
        knex('team_training_responses').insert({
          training_id: 1,
          user_id: 2,
        }),
        knex('team_training_responses').insert({
          training_id: 1,
          user_id: 3,
        }),
        knex('team_training_responses').insert({
          training_id: 1,
          user_id: 4,
        }),
        knex('team_training_responses').insert({
          training_id: 3,
          user_id: 1,
        }),
      ]);
    });
};
