function CreateVendorController() {
  var ctrl = new Controller();

  var pictureData = null;

  this.route = function(params) {
    pictureData = null;
    ctrl.loadSkeleton('/admin/html-component/create-vendor.html');
  };

  this.formSubmitEv = function() {
    var name = document.getElementById('name').value;
    if (!pictureData) {
      alert('Must select a picture');
      return;
    }
    if (name === '') {
      alert('Must enter a name');
      return;
    }
    ajax('POST', '/create-vendor', APP_PORT, JSON.stringify({
      VendorName: name,
      VendorPicture: pictureData,
      AdminToken: currSession.currToken, }),
      [{header: "Content-type", value: "application/json"}]) // Headers
      .then(function(res) {
        if (res.Success == 2) { // unauthorised
          alert('Token unauthorised. Login again to continue.');
          window.location = '#login';
          return;
        }
        else if (res.Success == 1) { // Internal err
          console.log(res);
          return;
        }
        window.location = '#home';
      })
      .catch(function(err) {
        console.log(err);
      });
  };

  /** Called when the user selects a file to upload */
  this.previewFile = function() {
    var preview = document.getElementById('vendorpicturepreview');
    var picture = document.getElementById('vendorpicture').files[0];
    var reader = new FileReader();

    reader.onloadend = function() {
      console.log(reader.result);
      preview.setAttribute('src', reader.result);
      pictureData = reader.result;
    }

    if (picture) {
      reader.readAsDataURL(picture);
    }
    else {
      preview.setAttribute('src', '');
      pictureData = null;
    }
  };
}

var createVendorController = new CreateVendorController();
