function CreateArticleController() {
  var ctrl = new Controller();

  var pictureData = null;
  var vendorID = null;

  this.route = function(params) {
    pictureData = null;
    vendorID = parseInt(params.vendorId);
    if (!vendorID) {
      alert("Vendor ID must be integer");
      return;
    }
    ctrl.loadSkeleton('/admin/html-component/create-article.html');
  };

  /** Called when the user presses the 'create' button */
  this.formSubmitEv = function() {
    var title = document.getElementById('title').value;
    var body = document.getElementById('body').value;

    // Validate data
    if (!pictureData) { alert('Must select a picture'); return; }
    if (!title) { alert('Must enter a name'); return; }
    if (!body) { alert('Must enter some body text'); return; }

    ajax('POST', '/create-article', APP_PORT, JSON.stringify({
      VendorID: vendorID,
      Title: title,
      Body: body,
      TimePosted: (new Date()).getTime(),
      Picture: pictureData,
      AdminToken: currSession.currToken,
    }), [{header: "Content-type", value: "application/json"}]) 
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
        window.location = '#edit-vendor/' + vendorID;
      })
      .catch(function(err) {
        console.log(err);
      });

  };

  /** Called when the user selects a file to upload */
  this.previewFile = function() {
    var preview = document.getElementById('articlepicturepreview');
    var picture = document.getElementById('articlepicture').files[0];
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

var createArticleController = new CreateArticleController();

