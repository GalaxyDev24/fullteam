require('app-module-path').addPath(__dirname);
require('dotenv').config();
var jsonfile = require('jsonfile');
var config = require('config');
var knex = require('lib/knex');
var Twitter = require('twitter');
var moment = require('moment');
var firebase = require('helpers/firebase');

console.log(config.env);

var client;
var user_id_str;

if ('development' === config.env) {
  user_id_str = '855437037981372416';
  client = new Twitter({
    consumer_key: 'kqr2PIFosF6EYxFLC2rkbIdzI',
    consumer_secret: '6vEwklJPWG6DBHAf1pUx5yCoUeXUkVO6zhlgEgLutHkjrs24T2',
    access_token_key: '855437037981372416-r6odZCbbxrG4M6Z5ZTQqKOFdABueJWK',
    access_token_secret: 'PQfjFiXmHTnc6LHcHBrxXzuIEuMKJMiLP5VjnhXiRx6uJ'
  });
} else {
  user_id_str = '1905472280';
  client = new Twitter({
    consumer_key: '1n4SlC6FBSaIY67Py5yPRjfVG',
    consumer_secret: 'DqMTdd5bLvkMr1NRaR1c6tQZFkt8n1SLyMIk5wlH5jnzuXvc3E',
    access_token_key: '1905472280-XAFi4oFtZ7ViVk4I1FUJTAnkXMR92BaYHc2aCmR',
    access_token_secret: '1MNNznjypOGfXm9njH5vUFGwBh20JVYBpP0WdgE30iqLW'
  });
}

var params = {screen_name: 'FullTeam', tweet_mode: 'extended'};
client.get('statuses/user_timeline', params, function(error, tweets, response) {
  if (!error) {
    //console.log(tweets);
    for(var i = 0; i < tweets.length; i++) {
      saveTweet(tweets[i]);
    }
    // var file = 'tmp/tweets.json';
    // jsonfile.writeFile(file, tweets, function (err) {
    //     console.error(err);
    // });
  }
});

var timelimit = 300000;
setTimeout(function() {
    process.exit(0);
}, timelimit);


// knex('post_meta')
//   .where('meta_key', 'tweet_id_str')
//   .where('meta_value', '855559981789315073')
//   .first()
//   .then(function(item){
//     console.log(item);
//     knex('posts').where('id', item.post_id).delete();
//     knex('post_meta').where('post_id', item.post_id).delete();
//   });

/**/

// You can also get the stream in a callback if you prefer. 
// (function(){

//   client.stream('statuses/filter', {
//     follow: user_id_str
//   }, function(stream) {
//     console.log('connected.');
//     stream.on('data', function(event) {
//       if (typeof event.delete !== 'undefined') {
//         var id_str = event.delete.status.id_str;
//         knex('twitter_status').where('id_str', id_str).del();
//         return;
//       }
//       if (event.created_at) {
//         saveTweet(event);
//       }
//     });

//     stream.on('error', function(error) {
//       throw error;
//     });
//   });
// })();
/**/

function saveTweet(event)
{
  var time = moment(event.created_at, 'ddd MMM DD HH:mm:ss ZZ YYYY');
  var created_at = time.format('YYYY-MM-DD HH:mm:ss');
  var json = JSON.stringify(event);

  // Try remove the link at the end of the twitter post
  var ix = event.full_text.lastIndexOf('https://t.co');
  if (typeof ix !== 'undefined' && ix != null && ix > 0) {
    event.full_text = event.full_text.substring(0, ix-1);
  }

  knex('posts')
    .innerJoin('post_meta', 'post_meta.post_id', 'posts.id')
    .where('post_meta.meta_key', 'tweet_id_str')
    .where('post_meta.meta_value', event.id_str)
    .count('posts.id as numposts')
    .then(function (results){
      var exists = results && results.length && results[0].numposts;
      if (!exists) {
        knex('twitter_status').insert({
          id_str: event.id_str,
          created_at: created_at,
          json: json
        }).then(function(twitter_status_ids) {
          console.log('Tweet Saved');
          var twitter_status_id = twitter_status_ids[0];
          var postdata = {};
          postdata.post_title = '';
          postdata.post_status = 'publish';
          postdata.comment_status = 'open';
          postdata.user_id = 0;
          postdata.post_content = event.full_text;
          postdata.post_parent_id = 0;
          postdata.post_parent_type = 'news_source';
          postdata.post_type = 'twitter_status';
          postdata.created_at = created_at;
          postdata.updated_at = created_at;
          postdata.time = time.valueOf();

          var postMeta = [];

          postMeta.tweet_json = json;
          postMeta.tweet_id_str = event.id_str;
          postMeta.twitter_status_id = twitter_status_id;
          
          knex('posts').insert(postdata).then(function(ids) {

            console.log('Tweet Post Saved');

            var post_id = ids[0];
            var post_meta_rows = [];

            for (var key in postMeta) {
              if (postMeta.hasOwnProperty(key)) {
                post_meta_rows.push({
                  post_id: post_id,
                  meta_key: key,
                  meta_value: postMeta[key],
                  created_at: created_at,
                  updated_at: null,
                });
              }
            }

            if (!post_meta_rows.length) {
              return;
            }

            knex.batchInsert('post_meta', post_meta_rows).then(function(newIDs) {
                firebsae.pushToTopic("twitter", {
                    title: "There is a new fullteam twitter post!",
                    body: "Why not hop over to the fullteam football newsfeed?",
                });
            }, function(error) {
              return;
            });

          }).catch(function(err) {
            console.log('Database Error - Tweet Post could not be saved');
            console.log(err);
          });

        }).catch(function(err) {
          console.log('Database Error - Tweet could not be saved');
          console.log(err);
        });
      }
    });
}
