
exports.seed = function(knex, Promise) {

  var comments = [{
      id: 1,
      post_id: 1,
      parent_id: 0,
      user_id: 2,
      content: 'Fusce lacinia arcu et nulla. Nulla vitae mauris non felis mollis faucibus.',
      created_at: '2016-10-20 12:00:00',
      updated_at: '2016-10-20 12:00:00',
    },{
      id: 2,
      post_id: 1,
      parent_id: 1,
      user_id: 3,
      content: 'Morbi in sem quis dui placerat ornare. Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam. Sed arcu. Cras consequat.',
      created_at: '2016-10-20 12:01:00',
      updated_at: '2016-10-20 12:01:00',
    },{
      id: 3,
      post_id: 2,
      parent_id: 0,
      user_id: 2,
      content: 'Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.',
      created_at: '2016-10-21 12:00:00',
      updated_at: '2016-10-21 12:00:00',
    },{
      id: 4,
      post_id: 1,
      parent_id: 0,
      user_id: 2,
      content: 'Pellentesque fermentum dolor. Aliquam quam lectus, facilisis auctor, ultrices ut, elementum vulputate, nunc.',
      created_at: '2016-10-22 12:00:00',
      updated_at: '2016-10-22 13:00:00',
    },

  ];

  var tasks = [];
  for (var i = 0; i < comments.length; i++) {
    tasks.push(knex('comments').insert(comments[i]));
  }

  // Deletes ALL existing entries
  return knex('comments').truncate().then(function() {
    return Promise.all(tasks);
  });
};
