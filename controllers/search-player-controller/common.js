var log = require('helpers/logger.js')

/** A module containing common functions between both
 * the distance.js and name.js modules. */

/** A function to parse the search results. Search results are straight
* from the mysql queries in the distance and name modules. */
function parseSearchResultsFunction(results) {
  var users = [];
  // Raw query returns a 2d array, the
  // first element is the array of
  // results, so we need that one 
  for (var ii = 0; ii < results[0].length; ++ii) {
    var userPositions = [];
    // Probs a really dumb way of doing things, but search through
    // all users to check if already added, if so then just add a
    // position to the list.
    var userUpdated = false;
    for (var jj = 0; jj < users.length; ++jj) {
      if (users[jj].UserID == results[0][ii].id) {
        userUpdated = true;
        users[jj].Positions.push(results[0][ii].position);
        break;
      }
    }
    if (!userUpdated) {
      users.push({
        UserID: results[0][ii].id,
        Positions: [results[0][ii].position],
        FirstName: results[0][ii].name,
        LastName: results[0][ii].last_name,
        PictureURL: results[0][ii].picture,
        Age: results[0][ii].age,
        AverageRating: results[0][ii].rating,
        Distance: results[0][ii].distance,
        Online: results[0][ii].online,
        LastActive: results[0][ii].last_active,
        Latitude: results[0][ii].lat,
        Longitude: results[0][ii].lon,
        ChatUserID: results[0][ii].chat_user_id,
      });
    }
  }
  log.debug(users);
  return users;
}

module.exports = parseSearchResultsFunction;
