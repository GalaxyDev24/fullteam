var currSession = new Session();


// Runs at the start of the app
function onPageLoad() {
  // Set up client side routing
  Router.setupRoutes();

  if (typeof(Storage) !== "undefined") {
    currSession.currToken = localStorage.getItem("AuthToken");
    if (!currSession.currToken) {
      currSession.currToken = null;
    }
  }
  if (!currSession.currToken) {
    window.location=('#login');
    return;
  }
}

if (window.addEventListener) { // W3C standard
  window.addEventListener('load', onPageLoad, false);
}
if (window.attachEvent) { // Microsoft
  window.attachEvent('onload', onPageLoad);
}
