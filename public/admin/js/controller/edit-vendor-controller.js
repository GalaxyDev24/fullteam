function EditVendorController() {
  var ctrl = new Controller();

  var pictureData = null;
  var vendorID = null;

  /** Stores whether or not a field has been edited */
  var edited = { name: false, picture: false, };

  /** Called on page load by Satnav. */
  this.route = function(params) {
    edited = { name: false, picture: false, };
    pictureData = null;
    vendorID = parseInt(params.id);
    if (!vendorID) {
      alert("Vendor ID must be integer");
      return;
    }

    // Load both the HTML skeletons and the vendor / article data for this ID at the same
    // time
    var vendorInfoReq = ajax('POST', '/get-vendor', APP_PORT, JSON.stringify({
      VendorID: vendorID}),
      [{header: "Content-type", value: "application/json"}]); 

    var vendorArticlesReq = ajax('POST', '/get-vendor-articles', APP_PORT, 
      JSON.stringify({
        VendorID: vendorID, }),
      [{header: "Content-type", value: "application/json"}]);

    var vendorArticleLi = ajax('GET', '/admin/html-component/article-li.html', WEB_PORT);

    var htmlSkeletonReq = 
      ctrl.loadSkeleton('/admin/html-component/edit-vendor.html');

    Promise.all([vendorInfoReq, vendorArticlesReq, 
      vendorArticleLi, htmlSkeletonReq])
      .then(function(res) {
        var vendorInfo = JSON.parse(res[0]).Vendor;
        var articleIDs = JSON.parse(res[1]).Articles;
        var articleLi = res[2];
        // Make articleLi into real DOM node
        var tmp = document.createElement('div');
        tmp.innerHTML = articleLi;
        articleLi = tmp.childNodes[0];

        // Request more in depth article data ASAP, then run everything
        // else in parallel
        var tasks = [];
        for (var ii = 0; ii < articleIDs.length; ++ii) {
          tasks.push(ajax('POST', '/get-article', APP_PORT, JSON.stringify({
            ArticleID: articleIDs[ii], }),
            [{header: "Content-type", value: "application/json"}]));
        }

        // Make sure when running all tasks that they're in the same order
        // as the articleIDs order
        Promise.all(tasks)
          .then(function(articleRes) {
            var articleList = document.getElementById('articlelist');
            for (var ii = 0; ii < articleRes.length; ++ii) {
              var article = JSON.parse(articleRes[ii]).Article;
              var liClone = articleLi.cloneNode(true);
              var titleEle = 
                liClone.querySelector('a');
              var pictureEle = liClone.querySelector('.article-picture');
              titleEle.innerHTML = article.Title;
              titleEle.setAttribute('href', 
                '#edit-article/' + vendorID + '/' + articleIDs[ii]);
              pictureEle.setAttribute('src', 
                article.PictureURL);
              articleList.appendChild(liClone);
            }
          })
          .catch(function(err) {
            console.log(err);
          });


        // Populate the skeleton with the info.
        document.getElementById('name')
          .setAttribute('value', vendorInfo.VendorName);
        document.getElementById('nameheader').innerHTML 
          = vendorInfo.VendorName;

        document.getElementById('vendorpicturepreview')
          .setAttribute('src', vendorInfo.VendorPictureURL);
      })
      .catch(function(err) {
        console.log(err);
      });
  };

  this.formSubmitEv = function() {
    console.log(edited);
    console.log(pictureData);
    var body = {
      VendorID: vendorID,
      AdminToken: currSession.currToken,
    };
    // Figure out what data needs to be sent
    if (edited.name) { 
      body.Name = document.getElementById('name').value;
    }
    if (edited.picture && pictureData) {
      body.Picture = pictureData;
    }
    ajax('POST', '/edit-vendor', APP_PORT, JSON.stringify(body),
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

    edited.picture = true;

    reader.onloadend = function() {
      preview.setAttribute('src', reader.result);
      pictureData = reader.result;
      console.log(pictureData);
    }

    if (picture) {
      reader.readAsDataURL(picture);
    }
    else {
      preview.setAttribute('src', '');
      pictureData = null;
    }
  };

  /** Called when the user types in the name box */
  this.nameEdited = function() { edited.name = true; };

  /** Function called by the create article button */
  this.createArticleEv = function() {
    window.location = '#create-article/' + vendorID;
  };

}

var editVendorController = new EditVendorController();


