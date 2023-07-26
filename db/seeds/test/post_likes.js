
exports.seed = function(knex, Promise) {

  var post_likes = [{
      id: 1,
      post_id: 1,
      user_id: 2,
      like_type: 'like',
      created_at: '2016-10-20 16:00:00',
      updated_at: '2016-10-20 16:00:00',
    },{
      id: 2,
      post_id: 1,
      user_id: 3,
      like_type: 'like',
      created_at: '2016-10-20 16:01:00',
      updated_at: '2016-10-20 16:01:00',
    },{
      id: 3,
      post_id: 2,
      user_id: 2,
      like_type: 'like',
      created_at: '2016-10-21 16:00:00',
      updated_at: '2016-10-21 16:00:00',
    },{
      id: 4,
      post_id: 2,
      user_id: 2,
      like_type: 'like',
      created_at: '2016-10-22 16:00:00',
      updated_at: '2016-10-22 16:00:00',
    },{
      id: 5,
      post_id: 1,
      user_id: 1,
      like_type: 'like',
      created_at: '2016-10-22 16:00:00',
      updated_at: '2016-10-22 16:00:00',
    },

  ];

  var tasks = [];
  for (var i = 0; i < post_likes.length; i++) {
    tasks.push(knex('post_likes').insert(post_likes[i]));
  }

  // Deletes ALL existing entries
  return knex('post_likes').truncate().then(function() {
    return Promise.all(tasks);
  });
};
