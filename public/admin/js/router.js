/**
 *  @file Manages routing URLs to different routes (found in routes/
 *  directory).  
 *  Currently uses SatNav library for routing.
 */

var Router = {
  /**
   * The config for satnav.
   */
  satnavConfig: {
    // Don't require HTML5
    html5: false,
    // Always update hash url
    force: true,
    // Time between hashchange polyfills. If on an older browser, and you update
    // the window's hash, it won't implement the hashchange event. Satnav
    // provides a polyfill for this. 
    poll: 100,
    // Default
    matchAll: false,
  },

  /**
   * Setup routing.
   */
  setupRoutes: function() {
    Satnav(Router.satnavConfig)
      .navigate({
        path: "home",
        directions: homeController.route,
        title: "Admin - Home",
      })

      .navigate({
        path: "login",
        directions: loginController.route,
        title: "Admin - Login",
      })

      .navigate({
        path: "create-vendor",
        directions: createVendorController.route,
        title: "Admin - Create Vendor",
      })

      .navigate({
        path: "create-article/{vendorId}",
        directions: createArticleController.route,
        title: "Admin - Create Article",
      })

      .navigate({
        path: "edit-vendor/{id}",
        directions: editVendorController.route,
        title: "Admin - Edit Vendor",
      })

      .navigate({
        path: "edit-article/{vendorId}/{id}",
        directions: editArticleController.route,
        title: "Admin - Edit Article",
      })


    // Function to check whether the admin token is still authorised
      .change(function() {
        if (!currSession.currToken) {
          window.location = '#login';
          return;
        }
        ajax('POST', '/admin-check', JSON.stringify({
          AdminToken: currSession.currToken,
        }), [{header: "Content-type", value: "application/json"}])
          .then(function(res) {
            res = JSON.parse(res);
            if (res.Success != 0) {
              throw res;
            }
            if (!res.IsValid) {
              window.location = '#login';
            }
          })
          .catch(function(err) {
            console.log(err);
          });
      })

      .otherwise('home')
      .go();
  },
};


