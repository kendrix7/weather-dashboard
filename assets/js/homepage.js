const apiKey = '9b8ee1ceace92b1727eafef8733c9a30';
const searchEl = document.getElementById('search-button');
const clearHistoryEl = document.getElementById('clear-history-button');
const searchHistoryEl = document.getElementById('search-history');
const iconEl = document.getElementById('icon');
const tempEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const uvEl = document.getElementById('uv');
const cityNameEl = document.getElementById('city-name');
const openWeathermapURL = 'https://api.openweathermap.org/';
let searchInputEl = document.getElementById('city-input');
let searchHistory = getHistory();

async function initPage() {
    searchEl.addEventListener('click',async () => {
        await populateSessionStorageWithCityData(searchInputEl.value);
        await updateSessionStorageHistory(searchInputEl.value);
        await displaySelectedCity(searchInputEl.value);
    });
    searchInputEl.addEventListener('keypress',async (event) => {
        if(event.key === "Enter") {
            await populateSessionStorageWithCityData(searchInputEl.value);
            await updateSessionStorageHistory(searchInputEl.value);
            await displaySelectedCity(searchInputEl.value);
        }
    });
    clearHistory();
    renderSearchHistory();
    if (searchHistory.length > 0) {
        getWeather(searchHistory[searchHistory.length - 1]);
    }
};

function kelivnToFahrenheit(temperatureInKelvin) {
    try {
        return Math.floor((temperatureInKelvin - 273.15) * 1.8 + 32);
    }catch(error) {
        console.error("!!! Error in kelivnToFahrenheit !!!", error.message);
    }
};

function clearHistory() {
    try {
        clearHistoryEl.addEventListener('click', () => {
            localStorage.clear();
            sessionStorage.clear();
            renderSearchHistory();
        });
    }catch(error) {
        console.error("!!! Error in clearHistory !!!", error.message);
    }
};

async function getHistory() {
    try {
        let searchHistory = JSON.parse(sessionStorage.getItem("History")) || [];
        return searchHistory;
    }catch(error) {
        console.error("!!! Error in getHistory !!!", error.message);
    }
};

async function getCityFromSessionStorage(cityName) {
    try {
        if (!cityName) throw new Error(`${cityName} is not a fucking city!`);
        let city = JSON.parse(sessionStorage.getItem(cityName));
        return city;
    }catch(error) {
        console.error("!!! Error in getCityFromSessionStorage !!!", error.message);
    }
}

async function addCityToLocalHistory(cityName) {
    try {
        let searchHistory = await getHistory();
        searchHistory.push(cityName);
        return searchHistory;
    }catch(error) {
        console.error("!!! Error in addCityToLocalHistory !!!", error.message);
    }
};

async function updateSessionStorageHistory(cityName) {
    let searchHistory = await addCityToLocalHistory(cityName);
    sessionStorage.setItem("History", JSON.stringify(searchHistory));
    renderSearchHistory();
};

async function getCityWeatherData(city) {
    try {
        let weatherObj = await axios.get(openWeathermapURL + 'data/2.5/weather?q=' + city + '&appid=' + apiKey);
        return weatherObj;
    }catch(error) {
        console.error("!!! Error in getCityWeatherData !!!", error.message);
    }
};

async function getCityUVIndex(cityData) {
    try {
        let requestURL = openWeathermapURL + 'data/2.5/uvi/forecast?lat=' + cityData.data.coord.lat + '&lon=' + cityData.data.coord.lon + '&appid=' + apiKey + '&cnt=1';
        let cityUVIndex = await axios.get(requestURL);
        return cityUVIndex;
    } catch(error) {
        console.error("!!! Error in getCityUVIndex !!!", error.message);
    }
};

async function getCityForecast(cityData) {
    try {
        let requestURL = openWeathermapURL + 'data/2.5/forecast?id=' + cityData.data.id + '&appid=' + apiKey;
        let cityForecast = await axios.get(requestURL);
        return cityForecast;
    }catch(error) {
        console.error("!!! Error in getCityForecast !!!", error.message);
    }
};

async function populateSessionStorageWithCityData(cityName) {
    try {
        let cityWeatherData = await getCityWeatherData(cityName);
        let cityUVIndex = await getCityUVIndex(cityWeatherData);
        let cityForecast = await getCityForecast(cityWeatherData);
        let combinedCityWeatherData = {
            weather: cityWeatherData.data,
            uvindex: cityUVIndex.data,
            forecast: cityForecast.data
        };
        sessionStorage.setItem(combinedCityWeatherData.weather.name, JSON.stringify(combinedCityWeatherData));
    }catch(error) {
        console.error("!!! Error in populateSessionStorageWithCityData !!!", error.message);
    }
};

async function renderSearchHistory() {
    let searchHistory = await getHistory();
    searchHistoryEl.innerHTML = '';
    searchHistory.forEach(entry => {
        let entryEl = document.createElement('input');
        entryEl.setAttribute('type','text');
        entryEl.setAttribute('readonly',true);
        entryEl.setAttribute('class', 'form-control d-block bg-white');
        entryEl.setAttribute('value', entry);
        entryEl.addEventListener('click',() => {
            displaySelectedCity(entry);
        })
        searchHistoryEl.append(entryEl);
    })
};

async function displaySelectedCity(cityName) {
    console.log("Proudly displaying the weather for: ", cityName);
    renderWeatherData(cityName);
    renderForecast(cityName);
};

async function renderWeatherData(cityName) {
    try {
        let city = await getCityFromSessionStorage(cityName);
        let currentDate = new Date(city.weather.dt*1000);
        let day = currentDate.getDate();
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();
        let weatherPic = city.weather.weather[0].icon;
        let UVIndex = document.createElement('span');
    
        cityNameEl.innerHTML = city.weather.name + ' (' + month + '/' + day + '/' + year + ') ';
        iconEl.setAttribute('src','https://openweathermap.org/img/wn/' + weatherPic + '@2x.png');
        iconEl.setAttribute('alt', city.weather.weather[0].description);
        tempEl.innerHTML = 'Temperature: ' + kelivnToFahrenheit(city.weather.main.temp) + ' &#176F';
        humidityEl.innerHTML = 'Humidity: ' + city.weather.main.humidity + '%';
        windEl.innerHTML = 'Wind Speed: ' + city.weather.wind.speed + ' MPH';
        UVIndex.setAttribute('class','badge badge-danger');
        UVIndex.innerHTML = city.uvindex[0].value;
        uvEl.innerHTML = 'UV Index: ';
        uvEl.append(UVIndex);
    } catch(error) {
        console.error("!!! Error in renderWeatherData !!!", error.message);
    }
}

async function renderForecast(cityName) {
    try {
        let city = await getCityFromSessionStorage(cityName);
        let forecastEls = document.querySelectorAll('.forecast');
        
        for (let i = 0; i < forecastEls.length; i++) {
            let forecastDateEl = document.createElement('p');
            let forecastWeatherEl = document.createElement('img');
            let forecastTempEl = document.createElement('p');
            let forecastHumidityEl = document.createElement('p');
            
            forecastEls[i].innerHTML = '';

            forecastDateEl.setAttribute('class','mt-3 mb-0 forecast-date');
            forecastDateEl.innerHTML = city.forecast.list[i].dt_txt;
    
            forecastWeatherEl.setAttribute('src','https://openweathermap.org/img/wn/' + city.forecast.list[i].weather[0].icon + '@2x.png');
            forecastWeatherEl.setAttribute('alt', city.forecast.list[i].weather[0].description);
    
            forecastTempEl.innerHTML = 'Temp: ' + kelivnToFahrenheit(city.forecast.list[i].main.temp) + ' &#176F';
    
            forecastHumidityEl.innerHTML = 'Humidity: ' + city.forecast.list[i].main.humidity + '%';
    
            forecastEls[i].append(forecastDateEl, forecastWeatherEl, forecastTempEl, forecastHumidityEl);
        }
    } catch(error) {
        console.error("!!! Error in renderForecast !!!", error.message);
    }
};

initPage();
