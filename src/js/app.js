import * as d3 from 'd3';
import axios from 'axios';

window.onload = () => {
    function removeAllChild(node) {
        while(node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    const { io } = require('socket.io-client'),
        socket = io('ws://localhost:64123/', {
          withCredentials: true,
          autoConnect: 10000
        }),
        client_id = '98f7b9b2b7ad48918dbe6cb206e6296f',

        playlists_list = document.getElementById('playlists');

    const gettoken = document.getElementById('gettoken'),
        connected = document.getElementById('connected');

    let socket_id = '',
        OauthToken = '',
        OauthType = '';

    gettoken.addEventListener('click', () => {
        let left = window.innerWidth / 2 - (370/2),
            top = window.innerHeight / 2 - (747/2);
        let url = 'https://accounts.spotify.com/authorize?response_type=token&redirect_uri=http://localhost:64123/callback&show_dialog=false&client_id=' + client_id + '&state=' + socket_id;
        let popin = window.open(url,'Get Token','height=747,width=370,resizable=no,left=' + left + ',top=' + top);
        if (window.focus) popin.focus();
    });

    /**
     *
     ** Socket.io
     *
     */

    socket.on('init', (id) => {
        console.log(id);
        socket_id = id;

        socket.emit('getToken', socket_id);
    });

    socket.on('token', args => {
        console.log(args);
        gettoken.classList.add('hidden');
        connected.classList.remove('hidden');

        OauthToken = args.access_token;
        OauthType = args.token_type;
    });

    /**
     *
     ** D3.js
     *
     */

    let search = document.getElementById('search'),
        result = document.getElementById('result'),

        add = document.getElementById('add'),
        data = [];

    search.addEventListener('input', () => {
        if(search.value != '') {
            axios({
                method: 'get',
                url: 'https://api.spotify.com/v1/search?type=artist&q=' + search.value,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': OauthType + ' ' + OauthToken
                }
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
                .catch(error => console.log(error));
        }
    });

    add.addEventListener('click', () => {
        if(search.dataset.id !== '') {
            axios({
                method: 'get',
                url: 'https://api.spotify.com/v1/artists/' + search.dataset.id,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + OauthToken
                }
            })
                .then(response => response.data)
                .then(artist => {
                    console.log(artist);
                    data.push({name: artist.name, follower: artist.followers.total});
                    redraw(data);
                })
                .catch(e => console.log(e))
        }
    });

    const SVG_PROPS = {
            width: document.querySelector('main').offsetWidth,
            height: document.querySelector('main').offsetHeight,
            padding: 10
        },
        container = d3.select('#container'),
        svg = container.append('svg');

        svg.attr('width', SVG_PROPS.width)
            .attr('height', SVG_PROPS.height)
            .attr('class', 'border border-gray-400 rounded');

    function redraw(data) {
        let bars = svg.selectAll('rect').data(data);
        bars.exit().remove();

        let maxValue = d3.max(data, e => e.follower),
            scaling = {
                    height: d3.scaleLinear()
                            .domain([0, maxValue])
                            .range([.5, (SVG_PROPS.height - SVG_PROPS.padding*2)]),

                    color: d3.scaleLinear()
                            .domain([0, maxValue])
                            .range(['blue', 'green'])
                },

            width = (SVG_PROPS.width - SVG_PROPS.padding*2) / data.length;

        bars.enter()
            .append('rect')
            .merge(bars)
            .attr('x', (d, i) => (i * width) + SVG_PROPS.padding)
            .attr('y', SVG_PROPS.height - SVG_PROPS.padding)
            .attr('width', width)
            .attr('height', 1)
            .attr('fill', (d) => scaling.color(d.follower))
            .attr('stroke', '#000')
            .attr('stroke-width', 1)
            .transition()
            .delay((d, i) => 1 + i * 50)
            .duration(450)
            .attr('y', (d) => (SVG_PROPS.height - SVG_PROPS.padding) - scaling.height(d.follower))
            .attr('height', (d) => scaling.height(d.follower));
    }
};