
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('article_vendors').del()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('article_vendors').insert({
          id: 1,
          name: "TheFootballArticleCompany",
          picture: "UserUploads/ProfilePictures/DefaultPicture.jpg",
        }),
        knex('article_vendors').insert({
          id: 4,
          name: "TheFootballArticleCompany2",
          picture: "UserUploads/ProfilePictures/DefaultPicture.jpg",
        }),
      ]);
    });
};
