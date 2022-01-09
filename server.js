const helper = require('./helper'),
    http = require('http'),
    url = require('url'),
    querystring = require('querystring'),

    server = http.createServer(),

    io = require('socket.io')(server),
    axios = require('axios'),

    SERVER_PORT = 64123,

    users = [],

    client_id = '98f7b9b2b7ad48918dbe6cb206e6296f',
    client_secret = '072f775dbf0d465aa5b739ecbc76cb4c';

try {
    const log = helper.log;

    server.on('request', (request, response) => {
        if(~helper.authorizedExt.indexOf(helper.getFileExt(request))) {
            helper.view(response, './public' + request.url.split('?')[0], helper.getFileExt(request));
        }
        else if(!request.url.match(/^\/socket\.io\//)) {
            console.log('└────────────────────────────────────────────────────────────────────────────────────────┘\n\n');
            console.log('┌────────────────────────────────────────────────────────────────────────────────────────┐');
            console.log('│                  ------------------> New request                                       │');
            console.log('├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ┤');

            const path = request.url.split('?')[0],
                queryObject = url.parse(request.url, true).query;

            log(path, 'path');
            switch (path) {
                case '/':
                    helper.view(response, './public/index.html');
                    break;

                case '/callback':
                    helper.view(response, './api/getToken.html');
                    break;

                default:
                    helper.return404(response);
            }

            console.log('├────────────────────────────────────────────────────────────────────────────────────────┤');
        }
    });

    io.on('connect', (socket) => {
        let socket_id = socket.id;
        users.push({id: socket_id, socket_id});

        socket.emit('init', socket_id);
        socket.on('init', (user) => {
            let index = users.findIndex(u => u.id === socket_id);
            if(~index) users.splice(index, 1);

            socket_id = user.id;

            index = users.findIndex(u => u.id === socket_id);
            if(~index) { users[index] = user; }
            else { users.push({...user, ...{socket_id: socket.id}}); }

            log(users, 'All Users - [Updated]');
        });

        log(users, 'All Users');

        socket.on('getToken', (id) => {
            let index = users.findIndex(user => user.id === id);

            if(~index) {
                if(users[index].token) {
                    socket.emit('token', users[index].token);
                }
            }
        });

        /* Disconnect */

        socket.on('disconnect', (reason) => {
            log(reason, 'Logout:');
            let index = users.findIndex(user => user.id === socket_id);
            if(~index) {
                users.splice(index, 1);
                log(users, 'All Users - [Updated - Logout]');
            }
        });

        /*
         *
         **    DO by the popup.
         *
         */

        socket.on('token', args => {
            if(!args.error) {
                let usr = users.findIndex(user => user.id === args.state);
                if(~usr) {
                    users[usr].token = {
                        access_token: args.access_token,
                        token_type: args.token_type,
                        expires_in: args.expires_in
                    };

                    log(users[usr].id);

                    io.to(users[usr].socket_id).emit('token', users[usr].token);
                }
            } else {
                log(args.error, 'Spotify Error:')
            }

            socket.emit('close');
        });
    });

    server.listen(SERVER_PORT);
}
catch (error) {
    console.log(error);
}