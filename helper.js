const fs = require('fs');

function return404(response) {
    log('404 not found', 'Response:');
    writeHead(response, 404);
    response.end();
    return 404;
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
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Origin': '*',
            'Content-Type': CONTENT_TYPE[type]
        };

    log(headers, 'Header:')

    response.writeHead(code, headers);
}

function view(response, path, type = 'html') {
    log(path, 'Try reading file:');

    fs.readFile(path, (error, content) => {
        if (error) {
            log(error, 'File: ' + path);
            return return404(response);
        }

        log(path, 'File');

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

function log(data, name = 'Console.Log()') {
    const getSpaces = (function() {
            let remains = 0;
            return (length, divider = 2) => {
                let maxLength = (88 - length)/divider;

                let spaces = '';
                for(let i=0; i < Math.floor(maxLength); i++) {
                    spaces += ' ';
                }

                if(remains > 0) {
                    for(let i=0; i < remains; i++) {
                        spaces += ' ';
                    }

                    remains = 0;
                } else  {
                    remains += (88 - length)%divider;
                }

                return spaces;
            };
        })(),
        logObject = (obj, indent = ' ') => {
            if(Array.isArray(obj)) {
                console.log('│' + indent + '[' + getSpaces(indent.length + 1, 1) + '│');

                obj.forEach(value => {
                    if(typeof value !== 'object') {
                        value.toString(10);
                        let coma = (obj.indexOf(value) < obj.length-1) ? ',' : ' ';
                        console.log('│' + indent + '    ' + value + coma + getSpaces(indent.length + value.length + 6, 1) + '│');
                    } else {
                        logObject(value, indent + '    ');
                    }
                });

                console.log('│' + indent + ']' + getSpaces(indent.length + 1, 1) + '│');
            } else {
                console.log('│' + indent + '{' + getSpaces(indent.length + 1, 1) + '│');

                Object.keys(obj).forEach(key => {
                    if(typeof obj[key] === 'string') {
                        key = key.toString();
                        obj[key] = obj[key].toString();
                        let coma = (Object.keys(obj).indexOf(key) < Object.keys(obj).length-1) ? ',' : ' ',
                            length = indent.length + key.length + obj[key].length + 7;
                        console.log('│' + indent + '    ' + key + ': ' + obj[key] + coma + getSpaces(length, 1) + '│');
                    } else {
                        key = key.toString();
                        console.log('│' + indent + '    ' + key + ': ' + getSpaces(indent.length + key.length + 6, 1) + '│');
                        logObject(obj[key],  indent + '    ');
                    }
                });

                console.log('│' + indent + '}' + getSpaces(indent.length + 1, 1) + '│');
            }
        };

    if(name.length > 0) {
        console.log('├────────────────────────────────────────────────────────────────────────────────────────┤');
        console.log('│' + getSpaces(name.length) + name + getSpaces(name.length) + '│');
        console.log('│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │');
    }

    switch(typeof data) {
        case 'number':
            data = data.toString(10);
        case 'string':
            let length = data.length;
            console.log('│' + getSpaces(length) + data + getSpaces(length) + '│');
            break;

        case 'object':
            logObject(data);
            break;
    }

    if(name.length > 0) {
        console.log('├────────────────────────────────────────────────────────────────────────────────────────┤');
    }
}

module.exports = {
    return404,
    log,
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