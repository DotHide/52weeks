var starwars = require('starwars-names-dothide');

var ele = document.getElementById('starwars');
ele.textContent = starwars.random();