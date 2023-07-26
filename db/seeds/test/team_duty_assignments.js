
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('team_duty_assignments').truncate()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('team_duty_assignments').insert({
          duty_id: 1,
          user_id: 2
        }),
      ]);
    });
};
