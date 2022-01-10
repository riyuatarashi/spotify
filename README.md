# Installation
## Clone the repository
```sh
git clone https://github.com/riyuatarashi/spotify.git
```

## Installation and building of dependencies
```sh
npm i
npm run prod
```

# Lunch server
This is a vanilla node.js project.
```sh
node server.js
```

This will open 64123 port of your localhost.

[http://localhost:64123/](http://localhost:64123/)

*!! WARNING !!*
Note that you can't change the port and the domain. Because Spotify API is set up to authorize only localhost:64123.

# Notes
- To make the user's session persistent the user's data is stored in *localstrorage*. If you want to restart an empty session. You just have to *delete the localstorage*.
- You can find the specific *code for d3* in the file `./src/js/app.js`.The code will be found after the comments. Around the *lines 200*
```js
    /**
     *
     ** D3.js
     *
     */
```
- To get the data, just click on *get token*. Then a popup will open. You will have to *connect with the following account*:
