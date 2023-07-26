
function buildWSMessage(command, options, randomNumber, jsonData) {
    const body = new Buffer(JSON.stringify(jsonData), 'utf8');
    const headers = new Buffer(12);
    
    headers.writeInt16BE(command, 0);
    headers.writeInt16BE(options, 2);
    headers.writeInt32BE(randomNumber, 4);
    headers.writeInt32BE(body.length, 8);
    
    return Buffer.concat([headers, body], 12 + body.length);
}

function buildHTTPMessage(command, options, randomNumber, jsonData) {
    return {
        cmd: command,
        opts: options,
        id: randomNumber,
        data: jsonData
    };
}

function decodeMessage(data) {
    var cmd = data.readInt16BE(0);
    var opts = data.readInt16BE(2);
    var id = data.readInt32BE(4);
    var dataLen = data.readUInt32BE(8);
    var dataStr = data.toString('utf8', 12, 12 + dataLen);

    return {
        "Command": cmd,
        "Options": opts,
        "ID": id,
        "DataLength": dataLen,
        "Data": JSON.parse(dataStr),
    };

}

module.exports = {
    dateOffset: 1451606400000,
    buildWSMessage: buildWSMessage,
    buildHTTPMessage: buildHTTPMessage,
    decodeMessage: decodeMessage,
};

