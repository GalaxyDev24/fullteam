module.exports = function(cmd, opts, id, dataLen, data, connection) {
    this.cmd = cmd;
    this.opts = opts;
    this.id = id;
    this.dataLen = dataLen;
    this.data = data;
    this.connection = connection;
};
