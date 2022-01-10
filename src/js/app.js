import * as d3 from 'd3';
import axios from 'axios';

window.onload = () => {
    function removeAllChild(node) {
        while(node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function localObject(args, obj = 'user') {
        let data = JSON.parse(localStorage.getItem(obj)),
            newlocalObject = {...data, ...args};
        localStorage.setItem(obj, JSON.stringify(newlocalObject));

        return newlocalObject;
    }

    function localArray(args = [], array = 'bars') {
        if(!localStorage.getItem(array)) { localStorage.setItem(array, '[]'); }
        let data = JSON.parse(localStorage.getItem(array)),
            newlocalArray = [...data, ...args];
        localStorage.setItem(array, JSON.stringify(newlocalArray));

        return newlocalArray;
    }

    const { io } = require('socket.io-client'),
        socket = io('ws://localhost:64123/', {
          withCredentials: true,
          autoConnect: 10000
        }),
        client_id = 'c744188e9ce24ab99a627346c82b24b1',

        playlists_list = document.getElementById('playlists');

    const gettoken = document.getElementById('gettoken'),
        connected = document.getElementById('connected');

    let socket_id = localObject().id,
        OauthToken = (localObject().token !== undefined) ? localObject().token.access_token : undefined,
        OauthType = (localObject().token !== undefined) ? localObject().token.token_type : undefined,
        headers = {};

    gettoken.addEventListener('click', () => {
        console.log(socket_id);
        let left = window.innerWidth / 2 - (370/2),
            top = window.innerHeight / 2 - (747/2),
            url = 'https://accounts.spotify.com/authorize';
           url += '?response_type=' +   'token';
           url += '&redirect_uri=' +    'http://localhost:64123/callback';
           url += '&show_dialog=' +     'false';
           url += '&scope=' +           'user-follow-read user-top-read';
           url += '&client_id=' +       client_id;
           url += '&state=' +           socket_id;

        let popin = window.open(url,'Get Token','height=747,width=370,resizable=no,left=' + left + ',top=' + top);
        if (window.focus) popin.focus();
    });

    if(OauthToken !== undefined) {
        gettoken.classList.add('hidden');
        connected.classList.remove('hidden');
    }

    /**
     *
     ** Socket.io
     *
     */

    socket.on('init', (id) => {
        if(localObject().id !== undefined) {
            socket.emit('init', localObject());
        } else {
            console.log(id);
            socket_id = localObject({id}).id;
        }
        socket.emit('getToken', socket_id);
    });

    socket.on('token', (args) => {
        console.log(args);
        gettoken.classList.add('hidden');
        connected.classList.remove('hidden');

        localObject({id: socket_id, token: args});
        OauthToken = args.access_token;
        OauthType = args.token_type;
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': OauthType + ' ' + OauthToken
        };

        if(localArray().length <= 0) {
            axios({
                method: 'get',
                url: 'https://api.spotify.com/v1/me/following?type=artist&limit=25',
                headers
            })
                .then(response => response.data.artists.items)
                .then(artists => {
                    console.log(artists);
                    artists = artists.map(artist => ({id: artist.id, name: artist.name, follower: artist.followers.total, img: artist.images[0].url}));
                    redrawlocalArray(localArray(artists));
                })
                .catch(e => console.log(e));

            axios({
                method: 'get',
                url: 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term',
                headers
            })
                .then(response => {
                    console.log(response);
                })
                .catch(e => console.log(e));
        }

        setTimeout(() => {
            gettoken.classList.remove('hidden');
            connected.classList.add('hidden');

            OauthToken = '';
            OauthType = '';
        }, parseInt(args.expires_in, 10) * 1000);
    });

    /**
     *
     ** EventListener
     *
     */

    let search = document.getElementById('search'),
        result = document.getElementById('result'),

        add = document.getElementById('add'),
        data = localArray();

    search.addEventListener('input', () => {
        if(search.value != '') {
            console.log(headers);
            axios({
                method: 'get',
                url: 'https://api.spotify.com/v1/search?type=artist&q=' + search.value,
                headers
            })
                .then(response => response.data.artists.items)
                .then(artists => {
                    if(!result.classList.contains('hidden')) result.classList.add('hidden');
                    removeAllChild(result);
                    search.dataset.id = '';

                    artists.forEach(artist => {
                        if(result.classList.contains('hidden')) result.classList.remove('hidden');

                        let p = document.createElement('p');
                        p.classList.add('cursor-pointer', 'hover:bg-gray-200', 'px-4');
                        p.appendChild(document.createTextNode(artist.name));

                        p.addEventListener('click', () => {
                            if(!result.classList.contains('hidden')) result.classList.add('hidden');
                            search.value = artist.name;
                            search.dataset.id = artist.id;
                        });

                        result.appendChild(p);
                    });
                })
                .catch(e => console.log(e));
        }
    });

    add.addEventListener('click', () => {
        if(search.dataset.id !== '') {
            axios({
                method: 'get',
                url: 'https://api.spotify.com/v1/artists/' + search.dataset.id,
                headers
            })
                .then(response => response.data)
                .then(artist => {
                    console.log(artist);
                    search.value = '';

                    data = localArray([{id: artist.id, name: artist.name, follower: artist.followers.total, img: artist.images[0].url}]);
                    redrawlocalArray(data);
                })
                .catch(e => console.log(e));
        }
    });

    /**
     *
     ** D3.js
     *
     */

    const main = document.getElementById('container');

    main.style.width = (window.innerWidth) + 'px';
    main.style.height = (window.innerHeight) - (document.querySelector('header').offsetHeight + document.querySelector('footer').offsetHeight) + 'px';

    const SVG_PROPS = {
            width: 370,
            height: 350,
            padding: 10
        },
        svg_container = d3.select('#container')
                            .append('div'),
        svg_title = svg_container.append('h2')
                            .text('Artists by followers:'),
        svg = svg_container.append('svg')
                    .attr('viewBox', [0, 0, SVG_PROPS.width, SVG_PROPS.height])
                    .attr('class', 'mb-auto mr-auto')
                    .attr('width', SVG_PROPS.width)
                    .attr('height', SVG_PROPS.height + 250);

    function redrawlocalArray(data = localArray()) {
        const artists = (() => {
            let artists = [];
            data.forEach(artist => {
                artists.push(artist.name);
            });
            return artists;
        })();

        const maxValue = d3.max(data, e => e.follower),
            width = (SVG_PROPS.width - SVG_PROPS.padding*2 - 70) / data.length,
            scaling = {
                    y: d3.scaleLinear()
                        .domain([maxValue, 0])
                        .range([.5, (SVG_PROPS.height - SVG_PROPS.padding*2)]),

                    x: d3.scaleBand()
                        .domain(artists)
                        .range([0, SVG_PROPS.width - 10 - 70]),

                    color: d3.scaleLinear()
                            .domain([0, maxValue])
                            .range(['#ff9c87', '#ff5733'])
                };

        svg.append('g')
            .attr('transform', 'translate(70,10)')
            .call(d3.axisLeft(scaling.y));

        svg.append('g')
            .attr('transform', `translate(70, ${SVG_PROPS.height - SVG_PROPS.padding})`)
            .call(d3.axisBottom(scaling.x))
            .selectAll('text')
                .style('text-anchor', 'end')
                .attr('dx', '-10')
                .attr('dy', '.15rem')
                .attr('transform', 'rotate(-65)');

        const bars = svg.append('g')
            .selectAll('rect')
            .data(data)
            .join(
                enter => {
                    enter.append('rect')
                        .attr('data-id', d => d.id)
                        .attr('x', (d, i) => (i * width) + 71)
                        .attr('y', SVG_PROPS.padding)
                        .attr('width', width)
                        .attr('height', 1)
                        .attr('fill', (d) => scaling.color(d.follower))
                            .on('mouseover', (e) => {
                                let img = document.querySelector('[data-link="' + e.target.dataset.id + '"');
                                img.classList.remove('hidden');
                            })
                            .on('mouseout', (e) => {
                                let img = document.querySelector('[data-link="' + e.target.dataset.id + '"');
                                img.classList.add('hidden');
                            })
                        .transition()
                            .delay((d, i) => 1 + i * 50)
                            .duration(450)
                            .attr('y', (d) => SVG_PROPS.padding + scaling.y(d.follower))
                            .attr('height', (d) => (SVG_PROPS.height - SVG_PROPS.padding*2) - scaling.y(d.follower))
                },
                update => update,
                exit => exit.remove()
            );

        svg.selectAll('rect')
            .data(data)
            .append('title')
            .text(d => d.name + ' - ' + d.follower + ' followers');

        const img = svg.append('g')
            .selectAll('img')
            .data(data)
            .join(
                enter => enter.append('image')
                            .attr('class', 'hidden')
                            .attr('data-link', d => d.id)
                            .attr('x', 200)
                            .attr('style', 'width: 150px; height: 150px;')
                            .attr('href', d => d.img),
                update => update,
                exit => exit.remove()
            );
    }

    if(data.length > 0) { redrawlocalArray(data); }
};