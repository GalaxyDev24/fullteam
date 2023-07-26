
exports.seed = function(knex, Promise) {

  var comment_likes = [{
      id: 1,
      comment_id: 1,
      user_id: 2,
      like_type: 'like',
      created_at: '2016-10-20 16:00:00',
      updated_at: '2016-10-20 16:00:00',
    },{
      id: 2,
      comment_id: 1,
      user_id: 3,
      like_type: 'like',
      created_at: '2016-10-20 16:01:00',
      updated_at: '2016-10-20 16:01:00',
    },{
      id: 3,
      comment_id: 2,
      user_id: 2,
      like_type: 'like',
      created_at: '2016-10-21 16:00:00',
      updated_at: '2016-10-21 16:00:00',
    },{
      id: 4,
      comment_id: 2,
      user_id: 2,
      like_type: 'like',
      created_at: '2016-10-22 16:00:00',
      updated_at: '2016-10-22 16:00:00',
    },{
      id: 5,
      comment_id: 1,
      user_id: 1,
      like_type: 'like',
      created_at: '2016-10-22 16:00:00',
      updated_at: '2016-10-22 16:00:00',
    },

  ];

  var tasks = [];
  for (var i = 0; i < comment_likes.length; i++) {
    tasks.push(knex('comment_likes').insert(comment_likes[i]));
  }

  // Deletes ALL existing entries
  return knex('comment_likes').truncate().then(function() {
    return Promise.all(tasks);
  });

};
