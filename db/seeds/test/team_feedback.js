
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('team_feedback').truncate()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('team_feedback').insert({
          id: 1,
          team_id: 1,
          from_user_id: 1,
          teamwork: 5,
          sportsmanship: 5,
          fitness: 5,
          reliability: 5,
          average: 5,
          feedback: "Hello",
          time_sent: (new Date()).getTime(),
        }),
      ]);
    });
};
