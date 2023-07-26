
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('team_duties').truncate()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('team_duties').insert({id: 1, team_id: 1, duty_name: "DUTY NAME HERE"}),
        knex('team_duties').insert({id: 2, team_id: 2, duty_name: "DUTY WILL BE DELETED IN TEST"}),
      ]);
    });
};
