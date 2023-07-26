
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('team_training').truncate()
    .then(function () {
      return Promise.all([
        knex('team_training').insert(
          {
            id: 1,
            team_id: 2,
            time: 123123123123,
            description: "Hello",
            is_custom_venue: false,
            lat: 123,
            lon: 456,
          }),
        knex('team_training').insert(
          {
            id: 2,
            team_id: 3,
            time: 0,
            description: "Hello",
            is_custom_venue: false,
            lat: 123,
            lon: 456,
          }),
        knex('team_training').insert(
          {
            id: 3,
            team_id: 4,
            time: 1231231231231232123,
            description: "Hello",
            is_custom_venue: false,
            lat: 123,
            lon: 456,
          }),
      ]);
    });
};
