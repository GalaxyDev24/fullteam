function HomeController() {
  var ctrl = new Controller();

  /** Called on page load by Satnav. */
  this.route = function(params) {
    ctrl.loadSkeleton('/admin/html-component/home.html')
      .then(function() {
        // Load all vendors, and vendor HTML skeleton
        var vendorInfoReq = ajax('POST', '/get-vendors', APP_PORT);

        var vendorHTML = ajax('GET', '/admin/html-component/vendor-li.html', WEB_PORT);

        Promise.all([vendorInfoReq, vendorHTML])
          .then(function(res) {
            var vendorInfo = JSON.parse(res[0]);
            if (vendorInfo.Vendors.length == 0) {
              document.getElementById('vendorlist').innerHTML = 'No vendors!';
              return;
            }

            var vendorHTML = res[1];
            // Turn vendor HTML string into actual HTML
            var tmp = document.createElement('div');
            tmp.innerHTML = vendorHTML;
            vendorHTML = tmp.childNodes[0];

            // loop over vendor info and insert into the DOM
            let vendorList = document.getElementById('vendorlist');
            for (var ii = 0; ii < vendorInfo.Vendors.length; ++ii) {
              var v = vendorInfo.Vendors[ii];
              vendorHTML.setAttribute('id', v.VendorID);
              vendorLink = vendorHTML.querySelector('a');
              vendorLink.innerHTML = v.VendorName;
              vendorLink.setAttribute('href', '#edit-vendor/' + v.VendorID);
              vendorHTML.querySelector('img').setAttribute('src', v.VendorPictureURL);
              // Add to document
              vendorList.appendChild(vendorHTML.cloneNode(true));
            }
          })
          .catch(function(err) {
            console.log(err);
          });

      });
  };

  /** Function called by the add vendor button on the homepage. */
  this.addVendorEv = function() {
    window.location = '#create-vendor';
  };
}

var homeController = new HomeController();

