
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('login_tokens').truncate()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('login_tokens').insert({user_id: 1, login_token: 'rdfV1m5jMR1gdB6fXgbZsFbmz26NvpEGprUrpXHk29Fo9unm1hUwUfaKAla5'}),
        knex('login_tokens').insert({user_id: 2, login_token: 'cowzr61cnvzHcH3UXgKXuMTy0skcMAKy4e3vXQ5Z5VAqIWhWvcuB38mC3UZN'}),
      ]);
    });
};
