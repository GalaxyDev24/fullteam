"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let q = require('q');

/** Gets recent articles all the way back to a given timestamp cutoff (in
 * millis) 
 * @Return a promise, which when successful returns a list of article IDs.
 */
function getRecentArticlesTimeCutoff(timestampCutoff) {
  return knex('article').select(['id', 'time_posted'])
    .where('time_posted', '>', timestampCutoff)
    .then(function(results) {
      let ret = {
        Success: 0,
        Description: null,
        Articles: [],
      }
      for (let ii = 0; ii < results.length; ++ii) {
        ret.Articles.push(results[ii].id);
      }
      return ret;
    })
}

/** Gets recent articles all the way back to a given post cutoff.
 * @Return a promise, which when successful returns a list of article IDs.
 */
function getRecentArticlesPostCutoff(id) {
  console.log(id)
  return knex('article as a1').select([
  'a1.id', 'a1.time_posted', 'posts.time'])
    .leftJoin('posts', 'posts.id', id)
    .where('a1.time_posted', '>', 'posts.time')
    .then(function(results) {
      console.log("Hey");
      let ret = {
        Success: 0,
        Description: null,
        Articles: [],
      }
      for (let ii = 0; ii < results.length; ++ii) {
        ret.Articles.push(results[ii].id);
      }
      return ret;
    });
}

/** Returns a list of articles, and their full data. The list of articles correlates to the list of articles passed in. */
function populateArticleList(articles) {
  let tasks = [];
  for (var ii = 0; ii < articles.length; ++ii) {
    let task = knex('article').select(['id', 'vendor_id', 'time_posted', 'wtitle', 'picture', 'article_body'])
      .where('id', articles[ii])
      .then(function(r) {
        return {
          VendorID: r.vendor_id,
          Title: r.title,
          PictureURL: r.picture,
          TimePosted: r.time_posted,
          Body: r.article_body,
        };
      })
    tasks.push(task);
  }
  return Promise.all(tasks);
}

module.exports = {
  populateArticleList: populateArticleList,
  getRecentArticlesTimeCutoff: getRecentArticlesTimeCutoff,
  getRecentArticlesPostCutoff, getRecentArticlesPostCutoff,

}
