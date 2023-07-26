function EditArticleController() {
  var ctrl = new Controller();

  var pictureData = null;
  var articleID = null;
  var vendorID = null;

  var edited = { picture: false, title: false, body: false, };

  this.route = function(params) {
    edited = { picture: false, title: false, body: false, };
    pictureData = null;
    articleID = parseInt(params.id);
    vendorID = parseInt(params.vendorId);
    if (!articleID || !vendorID) {
      alert("Article and Vendor ID must be integer");
      return;
    }
    var htmlSkeleReq = ctrl.loadSkeleton(
      '/admin/html-component/edit-article.html')

    // Request article data to populate fields with
    var articleInfoReq = ajax('POST', '/get-article', APP_PORT, JSON.stringify({
      ArticleID: articleID }),
      [{header: "Content-type", value: "application/json"}]);

    Promise.all([articleInfoReq, htmlSkeleReq])
      .then(function(res) {
        res[0] = JSON.parse(res[0]);
        if (res[0].Success == 0) {
          document.getElementById('title').value = res[0].Article.Title;
          document.getElementById('body').value = res[0].Article.Body;
          document.getElementById('articlepicturepreview')
            .setAttribute('src', res[0].Article.PictureURL);
        }
        else {
          throw JSON.stringify(res[0]);
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  };

  /** Called when the user presses the 'edit' button */
  this.formSubmitEv = function() {
    var title = document.getElementById('title').value;
    var body = document.getElementById('body').value;

    // Figure out what data we need to send
    var reqBody = {
      ArticleID: articleID,
      AdminToken: currSession.currToken,
    };
    if (pictureData) { reqBody.Picture = pictureData; }
    if (title) { reqBody.Title = title; }
    if (body) { reqBody.Body = body; }

    ajax('POST', '/edit-article', APP_PORT, JSON.stringify(reqBody), 
      [{header: "Content-type", value: "application/json"}]) 
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

  this.onTitleChangeEv = function() {
    edited.title = true;
  }
  this.onBodyChangeEv = function() {
    edited.title = true;
  }

  /** Called when the user selects a file to upload */
  this.previewFile = function() {
    edited.picture = true;
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

var editArticleController = new EditArticleController();

