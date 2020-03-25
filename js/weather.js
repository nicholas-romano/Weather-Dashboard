const API_KEY = '9f980e55608955868186255093b7d703';
var queryURL = "";
var cityDataObj = {};
var citiesData = [];

$( document ).ready(function() {

    var totalCities = window.localStorage.length;

    if (totalCities > 0) {

      for (var i = 0; i < totalCities; i++) {
        var cityName = window.localStorage.key(i);
        var cityData = getData(cityName);
        citiesData.push(cityData);

        if (i === totalCities - 1) {
          //display last city searched:
          displaySearchHistoryItem(cityName);
        }
      }

      console.log("citiesData: ", citiesData);

      $('#search-section').append('<div class="card">' +
                                    '<ul id="search-history" class="list-group list-group-flush">' +
                                    '</ul>' +
                                  '</div>');

      $.each(citiesData, function(index, city) {

        addSearchHistoryListItem(city.name);

      });
    }

    $(".search-history-list").on("click", function() {
      //City name in search history list is selected:
      $("#forecast-today").empty();
      $("#forecast-tiles").empty();
      var city = $(this).attr("id");
      displaySearchHistoryItem(city);
    });
    
    $("#search-city-name").on("click", function() {

        $("#forecast-today").empty();
        $("#forecast-heading").hide();
        $("#forecast-tiles").empty();

        var city = $("#city-input").val();

        addSearchHistoryListItem(city);
        
        if (city === "") {
            alert("Please enter a City name.")
        }
        else {
            queryURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=Imperial&appid=' + API_KEY; 
        }               

        $.ajax({
            url: queryURL,
            method: "GET",
            success: setTodaysForecast
        });
    });

});

function addSearchHistoryListItem(city) {
  $("#search-history").append('<li id="' + city + '" class="list-group-item search-history-list">' + city + '</li>');
}

function displaySearchHistoryItem(cityName) {

  cityDataObj = getData(cityName);
  console.log("cityDataObj: ", cityDataObj);

  for (var property in cityDataObj){
    if(cityDataObj.hasOwnProperty(property)){
      //console.log(property + ": " + cityDataObj[property]);
      switch(property) {
        case 'name':
          var name = cityDataObj[property];
        break;
        case 'date':
          var date = cityDataObj[property];
        break;
        case 'img':
          var img = cityDataObj[property];
        break;
        case 'imgAlt':
          var alt = cityDataObj[property];
        break;
        case 'temperature':
          var temp = cityDataObj[property];
        break;
        case 'humidity':
          var hum = cityDataObj[property];
        break;
        case 'wind_speed':
          var wind_speed = cityDataObj[property];
        break;
        case 'uv_index':
          var uv_index = cityDataObj[property];
        break;
        default:
          var fdate = cityDataObj[property].date;
          var fimg = cityDataObj[property].img;
          var falt = cityDataObj[property].imgAlt;
          var ftemp = cityDataObj[property].temperature;
          var fhum = cityDataObj[property].humidity;
          addForecastTile(fdate, fimg, falt, ftemp, fhum);
        break;
      }
    }
  }
  addTodaysForecast(name, date, img, alt, temp, hum, wind_speed, uv_index);
}

function setTodaysForecast(response) {
  console.log(response);

  //get search query city name:
  var city_name = response.name;

  //get today's date
  var todays_date = moment().format('l');

  //get today's current weather image:
  var weatherAlt = response.weather[0].main;
  var weatherSrc = getWeatherSrc(weatherAlt);

  //get today's current temperature:
  var temp = response.main.temp;

  //get today's current humidity:
  var hum = response.main.humidity;

  //get today's current wind speed:
  var wind_speed = response.wind.speed;

  cityDataObj["name"] = city_name;
  cityDataObj["date"] = todays_date;
  cityDataObj["img"] = weatherSrc;
  cityDataObj["imgAlt"] = weatherAlt;
  cityDataObj["temperature"] = temp;
  cityDataObj["humidity"] = hum;
  cityDataObj["wind_speed"] = wind_speed;

  //get coordinates:
  var lat = response.coord.lat;
  var lon = response.coord.lon;

  //set UV Index:
  setUVIndex(lat, lon, cityDataObj, city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed);

  $("#forecast-heading").show();

}

function setUVIndex(lat, lon, cityDataObj, city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed) {

    var queryURL = "http://api.openweathermap.org/data/2.5/uvi?appid=" + API_KEY + "&lat=" + lat + "&lon=" + lon;

    $.ajax({
        url: queryURL,
        method: "GET",
        success: function(response) {
          console.log("UV Index: ", response);
          var uv_index = response.value;
          cityDataObj["uv_index"] = uv_index;
          getNext5Days(city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed, uv_index);
        },
        error: function() {
            console.log("Could not return UV Index data.")
        }     
    });
}

function getNext5Days(city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed, uv_index) {

  addTodaysForecast(city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed, uv_index);

    var queryURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + city_name + "&units=Imperial&appid=" + API_KEY;

    $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function(response) {

          var forecastUpdateList = response.list;

          console.log("forecast: ", forecastUpdateList);

          var day = 1;

          //add Forecast tiles:
          for (var i = 0; i < forecastUpdateList.length; i++) {

            var forcastUpdate = forecastUpdateList[i];

            //get forecast update:
            var timestampDate = forcastUpdate.dt;
            var forcastDate = getForcastDate(timestampDate);

            //get the next day forecast:
            var forecastDay = moment().add(day, 'day').format('l');

            //check if the forcast update date has changed to the next day,
            //if so, add the new forecast tile:
            if (forecastDay === forcastDate) {

              //get weather image:
              var weatherAlt = forcastUpdate.weather[0].main;
              var weatherSrc = getWeatherSrc(weatherAlt);

              //get temperature:
              var temp = forcastUpdate.main.temp;

              //get humidity:
              var hum = forcastUpdate.main.humidity;

              addForecastTile(forcastDate, weatherSrc, weatherAlt, temp, hum);

              var forecastDay = "forecast_day_" + day;

              var forecastDateObj = {};

              forecastDateObj["date"] = forcastDate;
              forecastDateObj["img"] = weatherSrc;
              forecastDateObj["imgAlt"] = weatherAlt;
              forecastDateObj["temperature"] = temp;
              forecastDateObj["humidity"] = hum;

              cityDataObj[forecastDay] = forecastDateObj;

              //After the forecast day has been added, increment the day:
              day++;

            }

          } 
          setData(city_name, cityDataObj);

    });

}

function addTodaysForecast(name, date, src, alt, temp, hum, wind_speed, uv_index) {
    $("#forecast-today").html('<div class="card">' +
                                '<div class="card-body">' +
                                  '<h3 class="card-title"><span id="name">' + name + '</span> <span id="date">' + date + '</span><img id="weather-img" src="' + src + '" alt="' + alt + '"></h3>' +
                                  '<p class="card-subtitle mb-2 text-muted">Temperature: <span id="temperature">' + temp + '</span>°F</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">Humidity: <span id="humidity">' + hum + '</span>%</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">Wind Speed: <span id="wind_speed">' + wind_speed + '</span> MPH</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">UV Index: <span class="badge badge-danger" id="uv_index">' + uv_index + '</span></p>' +
                                '</div>' +
                              '</div>');
                           
}

function addForecastTile(date, src, alt, temp, hum) {

  $("#forecast-tiles").append('<div class="col-lg-3 col-md-4 col-sm-6">' +
                                '<div class="card">' +
                                    '<div class="card-body">' +
                                      '<h5 class="card-title forecast-date">' + date + '</h5>' +
                                      '<img id="weather-img" width="30" src="' + src + '" alt="' + alt + '">' +
                                      '<p class="card-text">Temp: <span class="forecast-temp">' + temp + '</span>&deg;F</p>' +
                                      '<p class="card-text">Humidity: <span class="forecast-hum">' + hum +'</span>%</p>' +
                                    '</div>' +
                                '</div>' +
                              '</div>');
}

function getWeatherSrc(weather) {

  var weatherSrc = "";

  switch(weather) {
    case 'Clear':
      weatherSrc = "images/sunny.png";
    break;
    case 'Clouds':
      weatherSrc = "images/cloudy.png";
    break;
    case 'Drizzle':
      weatherSrc = "images/drizzle.png";
    break;
    case 'Rain':
      weatherSrc = "images/rain.png";
    break;
    case 'Haze':
      weatherSrc = "images/foggy.png";
    break;
    case 'Snow':
      weatherSrc = "images/snow.png";
    break;
  }

  return weatherSrc;

}

function getForcastDate(ts) {

  // convert unix timestamp to milliseconds
  var ts_ms = ts * 1000;

  // initialize new Date object
  var date_ob = new Date(ts_ms);

  // year as 4 digits (YYYY)
  var year = date_ob.getFullYear();

  // month as 2 digits (MM)
  var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  month = removeLeadingZeros(month);

  // day as 2 digits (DD)
  var day = ("0" + date_ob.getDate()).slice(-2);

  day = removeLeadingZeros(day);

  var date = month + "/" + day + "/" + year;

  return date;

}

function removeLeadingZeros(numberString) {

  var fchar = numberString.substr(0, 1);

  if (fchar === "0") {
    numberString = numberString.slice(1, numberString.length);
  }

  return numberString;

}

function getData(key) {
  return JSON.parse(window.localStorage.getItem(key));
}

function setData(key, data) {
  window.localStorage.setItem(key, JSON.stringify(data));
}