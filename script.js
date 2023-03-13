const map = L.map('map', {
    boxZoom: false,
    closePopupOnClick: false,
    doubleClickZoom: false,
    dragging: false,
    keyboard: false,
    scrollWheelZoom: false,
    trackResize: false,
    touchZoom: false,
    zoomControl: false,
    zoomDelta: false,
});
const inputForm = document.querySelector('#input');
const resultsDiv = document.querySelector('#results');
const temperatureButton = document.querySelector('#temperature');
const hourlyDiv = document.querySelector('#hourly');
const dailyDiv = document.querySelector('#daily');

const backend = 'https://weather-app-backend-vu18.onrender.com';
const postBody = {
    type: null,
    value: null
};
let controller;
let timeoutId;

let results;
let selectedResult = 0;

async function getLocation(body) {
    controller = new AbortController();
    const signal = controller.signal;
    const res = await fetch(backend, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal
    });
    const data = res.ok && await res.json();
    if (!data) {
        const text = await res.text();
        throw new Error(text);
    } else {
        return data;
    };
};

async function getWeather(lat, lon) {
    const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&current_weather=true&temperature_unit=fahrenheit&timezone=auto`
        );
    const data = res.ok && await res.json();
    if (!data) {
        const text = await res.text(); 
        throw new Error(text);
    } else {
        return data;
    };
};

function celsius(temp) {
    return (temp - 32) * (5 / 9);
};

async function getData(input) {
    let lat;
    let lon;
    let location;
    let data;

    if (input.coords) {
        lat = input.coords.latitude;
        lon = input.coords.longitude;
        postBody.type = 'coords';
        postBody.value = {
            lat: lat,
            lon: lon
        };
        location = await getLocation(postBody);
    } else {
        lat = input.lat;
        lon = input.lon;
        location = input;
    };
    data = await getWeather(lat, lon);
    data.location = location;

    data.current_weather.temperature_c = celsius(data.current_weather.temperature);
    data.hourly.temperature_2m_c = data.hourly.temperature_2m.map(celsius);
    data.daily.temperature_2m_max_c = data.daily.temperature_2m_max.map(celsius);
    data.daily.temperature_2m_min_c = data.daily.temperature_2m_min.map(celsius);
    localStorage.setItem('data', JSON.stringify(data));
    populateBody(data);
};

function populateBody(data) {
    inputForm.value = '';
    resultsDiv.innerHTML = '';
    hourlyDiv.innerHTML = '';
    dailyDiv.innerHTML = '';

    const current = data.current_weather;
    const hourly = data.hourly;
    const daily = data.daily;
    const location = data.location;

    let temp;
    let hourlyTemps;
    let maxTemps;
    let minTemps;
    const fahrenheit = JSON.parse(localStorage.getItem('fahrenheit'));
    if (fahrenheit) {
        temp = Math.round(current.temperature) + '°F';
        hourlyTemps = hourly.temperature_2m;
        maxTemps = daily.temperature_2m_max;
        minTemps = daily.temperature_2m_min;
    } else {
        temp = Math.round(current.temperature_c) + '°C';
        hourlyTemps = hourly.temperature_2m_c;
        maxTemps = daily.temperature_2m_max_c;
        minTemps = daily.temperature_2m_min_c;
    };

    let origin;
    if (location.country === 'US' && !location.zip) {
        origin = location.state;
    } else {
        origin = location.country;
    };

    const weathercode = current.weathercode;
    let filename = weathercode;
    let description;
    if (weathercode <= 2) {
        const sunrise = daily.sunrise[0];
        const sunset = daily.sunset[0];
        const timeOfDay = (sunrise < current.time) && (current.time < sunset) ? 'day' : 'night';
        filename += timeOfDay;
        switch (weathercode) {
            case 0:
                description = (timeOfDay === 'day') ? 'Sunny' : 'Clear';
                break;
            case 1:
                description = (timeOfDay === 'day') ? 'Mostly sunny' : 'Mostly clear';
                break;
            case 2:
                description = 'Mostly cloudy';
                break;
        };
    } else {
        description = weathercodes.find(e => e.weathercode === weathercode).description;
    };

    const locationSpan = document.querySelector('#location');
    const descriptionSpan = document.querySelector('#description');
    const iconImg = document.querySelector('#icon');

    locationSpan.textContent = location.name + ', ' + origin;
    temperatureButton.textContent = temp;
    descriptionSpan.textContent = description;
    iconImg.src = `icons/${filename}.svg`;
    iconImg.alt = `Weather icon for "${description}"`;

    for (i = 0; i < 24; i += 3) {
        const card = document.createElement('div');
        const timeSpan = document.createElement('span');
        const iconImg = document.createElement('img');
        const tempSpan = document.createElement('span');

        const date = new Date(current.time);
        const hours = date.getHours() + i;
        date.setHours(hours);
        const time = (i === 0)
                      ? 'Now'
                      : date.toLocaleString('en-us', { hour12: true, hour: 'numeric' });
        const weathercode = hourly.weathercode[hours];
        let filename = weathercode;
        let alt;
        if (weathercode <= 2) {
            const day = (hours < 24) ? 0 : 1;
            const sunrise = new Date(daily.sunrise[day]);
            const sunset = new Date(daily.sunset[day]);
            const timeOfDay = (sunrise < date) && (date < sunset) ? 'day' : 'night';
            filename += timeOfDay;
            switch (weathercode) {
                case 0:
                    alt = (timeOfDay === 'day') ? 'Sunny' : 'Clear';
                    break;
                case 1:
                    alt = (timeOfDay === 'day') ? 'Mostly sunny' : 'Mostly clear';
                    break;
                case 2:
                    alt = 'Mostly cloudy';
                    break;
            };
        } else {
            alt = weathercodes.find(e => e.weathercode === weathercode).description;
        };
        timeSpan.textContent = time;
        iconImg.src = `icons/${filename}.svg`;
        iconImg.alt = alt;
        tempSpan.textContent = Math.round(hourlyTemps[hours]) + '°';

        card.classList.add('hourly-card');
        timeSpan.classList.add('span-1');
        iconImg.classList.add('icon-2');
        tempSpan.classList.add('hourly-temp', 'span-1');

        card.append(timeSpan, iconImg, tempSpan);
        hourlyDiv.append(card);
    };

    for (i = 0; i < 7; i++) {
        const card = document.createElement('div');
        const timeSpan = document.createElement('span');
        const iconImg = document.createElement('img');
        const maxSpan = document.createElement('span');
        const minSpan = document.createElement('span');

        const date = new Date(daily.time[i]);
        const time = (i === 0)
                      ? 'Today'
                      : date.toLocaleString('en-us', { weekday: 'long', timeZone: 'UTC' });
        const weathercode = daily.weathercode[i];
        const alt = weathercodes.find(e => e.weathercode === weathercode).description;

        timeSpan.textContent = time;
        iconImg.src = `icons/${weathercode}.svg`;
        iconImg.alt = alt;
        maxSpan.textContent = Math.round(maxTemps[i]) + '°';
        minSpan.textContent = Math.round(minTemps[i]) + '°';

        card.classList.add('daily-card');
        timeSpan.classList.add('span-1')
        iconImg.classList.add('icon-2');
        maxSpan.classList.add('max', 'span-1');
        minSpan.classList.add('min', 'span-1');

        card.append(timeSpan, iconImg, maxSpan, minSpan);
        dailyDiv.append(card);
    };
    
    if (!matchMedia('screen and (max-width: 1299px)').matches) {
        map.attributionControl.addAttribution('&copy; <a href="https://open-meteo.com/">Open-Meteo</a>');
        
        map.setView([location.lat, location.lon - (.0002 * screen.width)], 10);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        L.tileLayer(`${backend}/{z}/{x}/{y}.png`, {
            attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        }).addTo(map);

        const mapDiv = document.querySelector('#map');
        new ResizeObserver(() => {
            map.invalidateSize();
        }).observe(mapDiv);
    };
};

function populateResults(location, index) {
    const result = document.createElement('button');
    const primary = document.createElement('div');
    const locationSpan = document.createElement('span');
    const coordsSpan = document.createElement('span');
    const flagImg = document.createElement('img');

    let origin;
    if (location.country === 'US' && !location.zip) {
        origin = location.state;
    } else {
        origin = location.country;
    };
    locationSpan.textContent = location.name + ', ' + origin;
    coordsSpan.textContent = location.lat + ', ' + location.lon;
    const filename = location.country.toLowerCase();
    flagImg.src = `flags/${filename}.svg`;
    flagImg.alt = `Country abbreviation: ${filename}`;

    if (index === 0) {
        result.classList.add('selected-result');
    };
    result.classList.add('result');
    primary.classList.add('result-primary');
    locationSpan.classList.add('span-2', 'bold');
    coordsSpan.classList.add('span-2');
    flagImg.classList.add('flag');

    primary.append(locationSpan, coordsSpan);
    result.append(primary, flagImg);
    resultsDiv.append(result);
};

const search = document.querySelector('#search');
search.addEventListener('input', async () => {
    clearTimeout(timeoutId);
    if (controller) {
        controller.abort();
        controller = null;
    };
    results = null;
    selectedResult = 0;
    resultsDiv.innerHTML = '';
    timeoutId = setTimeout(async () => {
        const location = inputForm.value;
        postBody.value = location;
        if (location.length > 1 && /^[a-zA-Z]+( [a-zA-Z]+)*$/.test(location)) {
            postBody.type = 'city';
            results = await getLocation(postBody);
            results.forEach(populateResults);
        } else if (location.length === 5 && Number(location)) {
            postBody.type = 'zip';
            results = await getLocation(postBody);
            populateResults(results, 0);
        };
    }, 200);
});
search.addEventListener('submit', async e => {
    e.preventDefault();
    if (results) {
        getData(Array.isArray(results)
              ? results[selectedResult]
              : results);
    };
});

resultsDiv.addEventListener('pointermove', e => {
    let selectedButton = resultsDiv.querySelector('.selected-result');
    selectedButton.classList.remove('selected-result');
    selectedButton = e.target;
    selectedButton.classList.add('selected-result');
    const resultsArray = Array.from(resultsDiv.children);
    selectedResult = resultsArray.indexOf(selectedButton);
});
resultsDiv.addEventListener('pointerdown', e => {
    e.preventDefault();
    const resultsArray = Array.from(resultsDiv.children);
    const selectedButton = e.target;
    selectedResult = resultsArray.indexOf(selectedButton);
    selectedButton.classList.add('selected-result');
});
resultsDiv.addEventListener('pointerup', () => {
    getData(Array.isArray(results)
              ? results[selectedResult]
              : results);
});

inputForm.addEventListener('focus', () => {
    resultsDiv.classList.remove('display-none');
});
inputForm.addEventListener('blur', () => {
    resultsDiv.classList.add('display-none');
});
inputForm.addEventListener('keydown', e => {
    if (document.activeElement === inputForm) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            let selectedButton = resultsDiv.querySelector('.selected-result');
            selectedButton.classList.remove('selected-result');
            if (e.key === 'ArrowUp') {
                selectedResult--;
            } else {
                selectedResult++;
            };
            selectedResult = (selectedResult < 0)
                      ? results.length + selectedResult
                      : selectedResult % results.length;
            selectedButton = resultsDiv.children[selectedResult];
            selectedButton.classList.add('selected-result');
        };
    };
});

temperatureButton.addEventListener('click', () => {
    const data = JSON.parse(localStorage.getItem('data'));
    const current = data.current_weather;
    const hourly = data.hourly;
    const daily = data.daily;

    let currentTemp;
    let hourlyTemps;
    let maxTemps;
    let minTemps;
    let fahrenheit = JSON.parse(localStorage.getItem('fahrenheit'));
    fahrenheit = !fahrenheit;
    localStorage.setItem('fahrenheit', JSON.stringify(fahrenheit));
    if (fahrenheit) {
        currentTemp = Math.round(current.temperature) + '°F';
        hourlyTemps = hourly.temperature_2m;
        maxTemps = daily.temperature_2m_max;
        minTemps = daily.temperature_2m_min;
    } else {
        currentTemp = Math.round(current.temperature_c) + '°C';
        hourlyTemps = hourly.temperature_2m_c;
        maxTemps = daily.temperature_2m_max_c;
        minTemps = daily.temperature_2m_min_c;
    };

    temperatureButton.textContent = currentTemp;
    
    const hourlyArray = hourlyDiv.children;
    let hours = new Date(current.time).getHours();
    for (i = 0; i < hourlyArray.length; i++) {
        const tempSpan = hourlyArray[i].querySelector('.hourly-temp');
        tempSpan.textContent = Math.round(hourlyTemps[hours]) + '°';
        hours += 3;
    };

    const dailyArray = dailyDiv.children;
    for (i = 0; i < 7; i++) {
        const maxSpan = dailyArray[i].querySelector('.max');
        const minSpan = dailyArray[i].querySelector('.min');
        maxSpan.textContent = Math.round(maxTemps[i]) + '°';
        minSpan.textContent = Math.round(minTemps[i]) + '°';
    };
});

async function getTimestamp() {
    const res = await fetch(backend);
    const data = await res.json();
    localStorage.setItem('wakeup', data);
};

const wakeup = localStorage.getItem('wakeup');
const fifteenMinutes = 15 * 60 * 1000;
if (wakeup === null || Date.now() > wakeup + fifteenMinutes) {
    getTimestamp();
};

if (localStorage.getItem('fahrenheit') === null) {
    localStorage.setItem('fahrenheit', JSON.stringify(true));
};

if (localStorage.getItem('data') === null) {
    navigator.geolocation.getCurrentPosition(getData);
} else {
    const data = JSON.parse(localStorage.getItem('data'));
    const time = new Date(data.current_weather.time).getTime();
    const oneHour = 60 * 60 * 1000;
    if (Date.now() > time + oneHour) {
        getData(data.location);
    } else {
        populateBody(data);
    };
};
