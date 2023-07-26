// This is a script to setup all the directories needed for running the app.

console.log("Remember to add a knexfile.js! Base it off the knexfile.example.js in the root of the repository.")

var fs = require('fs');

// Make all directories
fs.access('public/UserUploads/TeamPictures', fs.constants.F_OK, (err) => {
  if (err) { fs.mkdir('public/UserUploads/TeamPictures'); }
});

fs.access('public/UserUploads/ProfilePictures', fs.constants.F_OK, (err) => {
  if (err) { fs.mkdir('public/UserUploads/ProfilePictures'); }
});

fs.access('public/UserUploads/GamePictures', fs.constants.F_OK, (err) => {
  if (err) { fs.mkdir('public/UserUploads/GamePictures'); }
});

fs.access('public/Article/Picture', fs.constants.F_OK, (err) => {
  if (err) { fs.mkdir('public/Article/Picture'); }
});


