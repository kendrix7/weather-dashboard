const apiKey = '9b8ee1ceace92b1727eafef8733c9a30';
const searchEl = document.getElementById('search-button');
const clearHistoryEl = document.getElementById('clear-history-button');
const searchHistoryEl = document.getElementById('search-history');
const searchHistory = JSON.parse(localStorage.getItem('search')) || [];
const iconEl = document.getElementById('icon');
const tempEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const uvEl = document.getElementById('uv');
const cityNameEl = document.getElementById('city-name');
const openWeathermapURL = 'https://api.openweathermap.org/';
let searchInputEl = document.getElementById('city-input');

// GOAL DESIGN
// function initPageFoReal() {
//     addEventListeners();
//     initialRender(); //getWeather from what is in sessionStorage
// }

function initPage() {
    console.log(searchHistory);

    searchEl.addEventListener('click',() => {
        let searchTerm = searchInputEl.value;
        getWeather(searchTerm);
        populateSessionStorageWithCityData(searchInputEl.value);
        searchHistory.push(searchTerm);
        localStorage.setItem('search',JSON.stringify([searchHistory]));
        renderSearchHistory();
    });

    clearHistory();

    function renderSearchHistory() {
        searchHistoryEl.innerHTML = '';
        for (let i=0; i < searchHistory.length; i++) {
            let historyItem = document.createElement('input');
            historyItem.setAttribute('type','text');
            historyItem.setAttribute('readonly',true);
            historyItem.setAttribute('class', 'form-control d-block bg-white');
            historyItem.setAttribute('value', searchHistory[i]);
            historyItem.addEventListener('click',() => {
                getWeather(this.value);
            })
            searchHistoryEl.append(historyItem);
        }
    }

    renderSearchHistory();

    //what is the desired effect of this if statement??
    if (searchHistory.length > 0) {
        getWeather(searchHistory[searchHistory.length - 1]);
    }

    function getWeather(cityName) {
        //  Using saved city name, execute a current condition get request from open weather map api
        let queryURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityName + '&appid=' + apiKey;
        axios.get(queryURL)
        .then((response) => {
            console.log("*** Response from API ***\n", response);
            //  Parse response to display current conditions
            //  Method for using 'date' objects obtained from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
            let currentDate = new Date(response.data.dt*1000);
            let day = currentDate.getDate();
            let month = currentDate.getMonth() + 1;
            let year = currentDate.getFullYear();
            cityNameEl.innerHTML = response.data.name + ' (' + month + '/' + day + '/' + year + ') ';
            let weatherPic = response.data.weather[0].icon;
            iconEl.setAttribute('src','https://openweathermap.org/img/wn/' + weatherPic + '@2x.png');
            iconEl.setAttribute('alt',response.data.weather[0].description);
            tempEl.innerHTML = 'Temperature: ' + kelivnToFahrenheit(response.data.main.temp) + ' &#176F';
            humidityEl.innerHTML = 'Humidity: ' + response.data.main.humidity + '%';
            windEl.innerHTML = 'Wind Speed: ' + response.data.wind.speed + ' MPH';
        let lat = response.data.coord.lat;
        let lon = response.data.coord.lon;
        let UVQueryURL = 'https://api.openweathermap.org/data/2.5/uvi/forecast?lat=' + lat + '&lon=' + lon + '&appid=' + apiKey + '&cnt=1';
        axios.get(UVQueryURL)
        .then((response) => {
            let UVIndex = document.createElement('span');
            UVIndex.setAttribute('class','badge badge-danger');
            UVIndex.innerHTML = response.data[0].value;
            uvEl.innerHTML = 'UV Index: ';
            uvEl.append(UVIndex);
        });
//  Using saved city name, execute a 5-day forecast get request from open weather map api
        let cityID = response.data.id;
        let forecastQueryURL = 'https://api.openweathermap.org/data/2.5/forecast?id=' + cityID + '&appid=' + apiKey;
        axios.get(forecastQueryURL)
        .then((response) => {
//  Parse response to display forecast for next 5 days underneath current conditions
            // console.log(response);
            let forecastEls = document.querySelectorAll('.forecast');
            for (i=0; i<forecastEls.length; i++) {
                forecastEls[i].innerHTML = '';
                let forecastIndex = i*8 + 4;
                let forecastDate = new Date(response.data.list[forecastIndex].dt * 1000);
                let forecastDay = forecastDate.getDate();
                let forecastMonth = forecastDate.getMonth() + 1;
                let forecastYear = forecastDate.getFullYear();
                let forecastDateEl = document.createElement('p');
                forecastDateEl.setAttribute('class','mt-3 mb-0 forecast-date');
                forecastDateEl.innerHTML = forecastMonth + '/' + forecastDay + '/' + forecastYear;
                forecastEls[i].append(forecastDateEl);
                let forecastWeatherEl = document.createElement('img');
                forecastWeatherEl.setAttribute('src','https://openweathermap.org/img/wn/' + response.data.list[forecastIndex].weather[0].icon + '@2x.png');
                forecastWeatherEl.setAttribute('alt',response.data.list[forecastIndex].weather[0].description);
                forecastEls[i].append(forecastWeatherEl);
                let forecastTempEl = document.createElement('p');
                forecastTempEl.innerHTML = 'Temp: ' + kelivnToFahrenheit(response.data.list[forecastIndex].main.temp) + ' &#176F';
                forecastEls[i].append(forecastTempEl);
                let forecastHumidityEl = document.createElement('p');
                forecastHumidityEl.innerHTML = 'Humidity: ' + response.data.list[forecastIndex].main.humidity + '%';
                forecastEls[i].append(forecastHumidityEl);
                }
            })
        });  
    }
};

function kelivnToFahrenheit(temperatureInKelvin) {
    return Math.floor((temperatureInKelvin - 273.15) * 1.8 + 32);
};

function clearHistory() {
    clearHistoryEl.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
    });
};

async function getCityWeatherData(city) {
    try {
        let weatherObj = await axios.get(openWeathermapURL + 'data/2.5/weather?q=' + city + '&appid=' + apiKey);
        return weatherObj;
    }catch(error) {
        console.error("!!! Error in getCityWeatherData !!!", error.message);
    }
}

// Be sure to JSON.parse the cityDta if it is coming from sessionStorage
async function getCityUVIndex(cityData) {
    try {
        let requestURL = openWeathermapURL + 'data/2.5/uvi/forecast?lat=' + cityData.data.coord.lat + '&lon=' + cityData.data.coord.lon + '&appid=' + apiKey + '&cnt=1';
        let cityUVIndex = await axios.get(requestURL);
        return cityUVIndex;
    } catch(error) {
        console.error("!!! Error in getCityUVIndex !!!", error.message);
    }
}

async function getCityForecast(cityData) {
    try {
        let requestURL = openWeathermapURL + 'data/2.5/forecast?id=' + cityData.data.id + '&appid=' + apiKey;
        let cityForecast = await axios.get(requestURL);
        return cityForecast;
    }catch(error) {
        console.error("!!! Error in getCityForecast !!!", error.message);
    }
}

async function populateSessionStorageWithCityData(cityName) {
    try {
        let cityWeatherData = await getCityWeatherData(cityName);
        let cityUVIndex = await getCityUVIndex(cityWeatherData);
        let cityForecast = await getCityForecast(cityWeatherData);
        let combinedCityWeatherData = {
            cityWeatherData: cityWeatherData.data,
            cityUVIndex: cityUVIndex.data,
            cityForecast: cityForecast.data
        };
        sessionStorage.setItem(combinedCityWeatherData.cityWeatherData.name, JSON.stringify(combinedCityWeatherData));
    }catch(error) {
        console.error("!!! Error in populateSessionStorageWithCityData !!!", error.message);
    }
}

async function renderSearchHistory2() {
    searchHistoryEl.innerHTML = '';


}

// function renderSearchHistory() {
//     searchHistoryEl.innerHTML = '';
//     for (let i=0; i < searchHistory.length; i++) {
//         let historyItem = document.createElement('input');
//         historyItem.setAttribute('type','text');
//         historyItem.setAttribute('readonly',true);
//         historyItem.setAttribute('class', 'form-control d-block bg-white');
//         historyItem.setAttribute('value', searchHistory[i]);
//         historyItem.addEventListener('click',() => {
//             getWeather(this.value);
//         })
//         searchHistoryEl.append(historyItem);
//     }
// }

// TODO make a DisplaySelectedCity function

initPage();
