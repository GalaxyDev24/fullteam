/** Controller base class, used with composition not inheritance */
function Controller() {
  /** Function to load a HTML skeleton. Returns a promise which if fulfilled
   * means the HTML is currently in the document. Overwrites anything inside the
   * main container div (see index.html) 
   * @param compURL {String} - The component URL (i.e /admin/html-component/home.html) 
   */
  this.loadSkeleton = function(compURL) {
    console.log(compURL);
    return ajax("GET", compURL, WEB_PORT)
      .then(function(result) {
        document.getElementById('app').innerHTML = result;
      })
      .catch(function(err) {
        console.log(err);
        throw err;
      });
  };
}

