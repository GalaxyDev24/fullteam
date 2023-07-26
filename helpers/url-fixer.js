
module.exports = function(url) {
  if(process.argv[2] && process.argv[2] === '--remove-host') {
    return url
            .replace('https://127.0.0.1:3000/', '/')
            .replace('http://localhost.fullteamfootball.com:3000//', '/')
            .replace('http://localhost.fullteamfootball.com:3000/', '/')
            ;
  } else {
    return url;
  }
};