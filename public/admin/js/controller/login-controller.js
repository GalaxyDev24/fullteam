function LoginController() {
  var ctrl = new Controller();

  /** Called on page load by Satnav. */
  this.route = function(params) {
    ctrl.loadSkeleton("/admin/html-component/login.html");
  };

  /** Processes a form submit event for the login page */
  this.login = function() {
    var pass = document.getElementById('pass').value;
    currSession.requestToken(pass)
    .then(function() {
      if (typeof(Storage) !== "undefined") {
        localStorage.setItem("AuthToken", currSession.currToken);
      }
      window.location = '#home';
      return;
    })
      .catch(function(err) {
        console.log(err);
        alert('Bad password');
      });
  };
}

var loginController = new LoginController();
