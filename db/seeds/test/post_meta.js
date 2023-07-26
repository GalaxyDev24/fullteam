exports.seed = function(knex, Promise) {

  var post_meta = [{
      id: 1,
      post_id: 1,
      meta_key: 'key_one',
      meta_value: 'value_one',
      created_at: '2016-10-19 12:00:00',
      updated_at: '2016-10-19 12:00:00',
    },{
      id: 2,
      post_id: 1,
      meta_key: 'key_two',
      meta_value: 'value_two',
      created_at: '2016-10-19 12:00:00',
      updated_at: '2016-10-19 12:00:00',
    },{
      id: 3,
      post_id: 1,
      meta_key: 'key_three',
      meta_value: 'value_three',
      created_at: '2016-10-19 12:00:00',
      updated_at: '2016-10-19 12:00:00',
    },
  ];

  var tasks = [];
  for (var i = 0; i < post_meta.length; i++) {
    tasks.push(knex('post_meta').insert(post_meta[i]));
  }

  // Deletes ALL existing entries
  return knex('post_meta').truncate().then(function() {
    return Promise.all(tasks);
  });

};