
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('admin_token').del()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('admin_token').insert({token: "asd", valid_until: 4000000000000}),
      ]);
    });
};
