var faker = require('faker');
var moment = require('moment');

exports.seed = function(knex, Promise) {

  var posts = [{
      id: 1,
      user_id: 5,
      post_title: '',
      post_content: 'Morbi in sem quis dui placerat ornare. Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam. Sed arcu. Cras consequat.',
      post_status: 'publish',
      comment_status: 'open',
      post_parent_id: 1,
      post_parent_type: 'user',
      post_type: 'status',
      created_at: '2016-10-19 12:00:00',
      updated_at: '2016-10-19 12:00:00',
    }, {
      id: 2,
      user_id: 5,
      post_title: '',
      post_content: 'Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.',
      post_status: 'publish',
      comment_status: 'open',
      post_parent_id: 1,
      post_parent_type: 'user',
      post_type: 'status',
      created_at: '2016-10-19 12:00:00',
      updated_at: '2016-10-19 12:00:00',
    }, {
      id: 3,
      user_id: 6,
      post_title: '',
      post_content: 'Ut aliquam sollicitudin leo.',
      post_status: 'publish',
      comment_status: 'open',
      post_parent_id: 1,
      post_parent_type: 'user',
      post_type: 'status',
      created_at: '2016-10-19 12:00:00',
      updated_at: '2016-10-19 12:00:00',
    },

  ];

  var datetime = moment().subtract(1, 'months');

  for (var i = 4; i < 2000; i++) {
    var random_milliseconds = Math.floor(Math.random() * 30 * 60 * 1000) + 1;
    var random_user_id = Math.floor(Math.random() * 20) + 1;
    datetime = datetime.add(random_milliseconds, 'milliseconds');

    posts.push({
      id: i,
      user_id: random_user_id,
      post_title: faker.random.words(),
      post_content: faker.lorem.paragraph(),
      post_status: 'publish',
      comment_status: 'open',
      post_parent_id: 1,
      post_parent_type: 'user',
      post_type: 'status',
      created_at: datetime.format('YYYY-MM-DD HH:mm:ss'),
      updated_at: datetime.format('YYYY-MM-DD HH:mm:ss'),
      system: false,
      time: datetime.valueOf(),
    });
  }

  var tasks = [];
  for (var i = 0; i < posts.length; i++) {
    tasks.push(knex('posts').insert(posts[i]));
  }

  // Deletes ALL existing entries
  return knex('posts').truncate().then(function() {
    return Promise.all(tasks);
  });

};