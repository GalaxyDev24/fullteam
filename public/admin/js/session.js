/** Session object, stores current admin token */
function Session() {
  /** This session's current token. If null, the client is not authenticated. */
  this.currToken = null;

  /** Requests a new token given the passcode. Returns promise which will
   * be resolved if this function is successful, rejected otherwise. The
   * promise will be empty. This function stores the newly requested
   * token in currToken. */
  this.requestToken = function(passcode) {
    // Get reference to this scope's this for the closure
    var thisRef = this;

    return ajax("POST", "/admin-login", APP_PORT, 
      JSON.stringify({ Pass: passcode, }),  // Data
      [{header: "Content-type", value: "application/json"}]) // Headers
      .then(function(result) {
        result = JSON.parse(result);
        console.log(result);
        if (result.Success == 0) {
          thisRef.currToken = result.Token;
        }
        else {
          throw "Unauthorised";
        }
      });
  }

  return this;
}


