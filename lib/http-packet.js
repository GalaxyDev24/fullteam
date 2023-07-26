/** Login token will be undefined if this is a login or registration request */
module.exports = function(cmd, opts, id, data,
                          loginToken,
                          res) {
    this.cmd = cmd;
    this.opts = opts;
    this.id = id;
    this.data = data;
    this.loginToken = loginToken;
    this.res = res;
};
