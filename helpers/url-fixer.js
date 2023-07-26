
module.exports = function(url) {
  if(process.argv[2] && process.argv[2] === '--remove-host') {
    return url
            .replace('https://ec2-3-10-51-119.eu-west-2.compute.amazonaws.com/', '/')
            .replace('http://ec2-3-10-51-119.eu-west-2.compute.amazonaws.com//', '/')
            .replace('http://ec2-3-10-51-119.eu-west-2.compute.amazonaws.com/', '/')
            ;
  } else {
    return url;
  }
};