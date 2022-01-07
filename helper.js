const fs = require('fs');

function return404(response) {
    console.log('\t - Other paths have been called. Be careful of Hackers');
    writeHead(response, 404);
    response.end();
    return 404;
}

function logFileRead(path) {
    console.log('\n' +
        '--- file ---\n' +
        'Path : ' + path + '\n' +
        '---\n');
}

function writeHead(response, code = 200, type = 'html') {
    const CONTENT_TYPE = {
            'html': 'text/html; charset=utf-8',
            'json': 'application/json',
            'css': 'text/css; charset=utf-8',
            'js': 'application/javascript; charset=utf-8',
            'eot': 'application/vnd.ms-fontobject',
            'svg': 'image/svg+xml',
            'ttf': 'application/x-font-truetype',
            'woff': 'application/font-woff',
            'woff2': 'application/font-woff2'
        },
        headers = {
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, Origin, Accept, Authorization',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Origin': '*',
            'Content-Type': CONTENT_TYPE[type]
        };

    console.log('\n--------- Head --------');
    console.log(headers);
    console.log('---------\n');

    response.writeHead(code, headers);
}

function view(response, path, type = 'html') {
    console.log('Try read file -> ' + path);
    fs.readFile(path, (error, content) => {
        if (error) {
            console.log('File: ' + path + ' can\'t be read.\n');
            console.log(error);
            return return404(response);
        }

        logFileRead(path);

        writeHead(response, 200, type);
        response.write(content);
        response.end();
    });
}

function getFileName(request) {
    let fileName = request.url.split('/');
    return fileName[fileName.length - 1].split('?')[0];
}

function getFileExt(request) {
    let fileExt = getFileName(request).split('.');
    return fileExt[fileExt.length - 1];
}

module.exports = {
    return404,
    logFileRead,
    writeHead,
    view,

    getFileName,
    getFileExt,

    authorizedExt: [
        'css',
        'js',

        'map',
        
        'eot',
        'svg',
        'ttf',
        'woff',
        'woff2'
    ]
};