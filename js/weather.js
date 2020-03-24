const API_KEY = '9f980e55608955868186255093b7d703';
var queryURL = "";

$( document ).ready(function() {
    
    $("#search-city-name").on("click", function() {

        $("#forecast-today").empty();
        $("#forecast-heading").hide();
        $("#forecast-tiles").empty();

        var city = $("#city-input").val();
        
        if (city === "") {
            alert("Please enter a City name.")
        }
        else {
            queryURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=Imperial&appid=' + API_KEY; 
        }               

        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(function(response) {
              console.log("weather ", response);

              //get search query city name:
              var city_name = response.name;

              //get today's date
              var todays_date = moment().format('l');

              //get today's current weather image:
              var weather = response.weather[0].main;
              var weatherImg = setWeatherImage(weather);

              //get today's current temperature:
              var temp = response.main.temp;

              //get today's current humidity:
              var hum = response.main.humidity;

              //get today's current wind speed:
              var wind_speed = response.wind.speed;

              var lat = response.coord.lat;
              var lon = response.coord.lon;

              //get UV Index:
              var uv_index = getUVIndex(lat, lon);

              addTodaysForecast(city_name, todays_date, weatherImg, temp, hum, wind_speed, uv_index);

              getNext5Days(city_name);

              $("#forecast-heading").show();

        });    

  });

});

function getUVIndex(lat, lon) {

    var queryURL = "https://api.openweathermap.org/data/2.5/uvi/forecast?&lat=" + lat + "&lon" + lon + "appid=" + API_KEY;

    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function(response) {
        console.log("UV Index: ", response);
        var uv_index = response[0].value;
        return uv_index;
    });
    
}

function getNext5Days(city_name) {

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
              var weather = forcastUpdate.weather[0].main;
              var weatherImg = setWeatherImage(weather);

              //get temperature:
              var temp = forcastUpdate.main.temp;

              //get humidity:
              var hum = forcastUpdate.main.humidity;

              addForecastTile(forcastDate, weatherImg, temp, hum);

              //After the forecast day has been added, increment the day:
              day++;

            }

          } 


    });

}

function addTodaysForecast(city_name, todays_date, weatherImg, temp, hum, wind_speed, uv_index) {
    $("#forecast-today").html('<div class="card">' +
                                '<div class="card-body">' +
                                  '<h3 class="card-title"><span id="city">' + city_name + '</span> <span id="title-date">(' + todays_date + ')</span><span id="weather-today">' + weatherImg + '</span></h3>' +
                                  '<p class="card-subtitle mb-2 text-muted">Temperature: <span id="temp">' + temp + '</span>°F</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">Humidity: <span id="hum">' + hum + '</span>%</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">Wind Speed: <span id="wind">' + wind_speed + '</span> MPH</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">UV Index: <span class="badge badge-danger" id="uv">' + uv_index + '</span></p>' +
                                '</div>' +
                              '</div>');
}

function addForecastTile(date, weatherImg, temp, hum) {

  $("#forecast-tiles").append('<div class="col-lg-3 col-md-4 col-sm-6">' +
                                '<div class="card">' +
                                    '<div class="card-body">' +
                                      '<h5 class="card-title forecast-date">' + date + '</h5>' +
                                        weatherImg +
                                      '<p class="card-text">Temp: <span class="forecast-temp">' + temp + '</span>&deg;F</p>' +
                                      '<p class="card-text">Humidity: <span class="forecast-hum">' + hum + '</span>%</p>' +
                                    '</div>' +
                                '</div>' +
                              '</div>');
}

function setWeatherImage(weather) {

  var weatherImg = "";

  switch(weather) {
    case 'Sunny':
      weatherImg = '<img src="images/sunny.png" alt="Sunny">';
    break;
    case 'Clouds':
      weatherImg = '<img src="images/cloudy.png" alt="Cloudy">';
    break;
    case 'Drizzle':
      weatherImg = '<img src="images/drizzle.png" alt="Drizzle">';
    break;
    case 'Rain':
      weatherImg = '<img src="images/rain.png" alt="Raining">';
    break;
    case 'Haze':
      weatherImg = '<img src="images/foggy.png" alt="Foggy">';
    break;
    case 'Snow':
      weatherImg = '<img src="images/snow.png" alt="Snowing">';
    break;
  }

  return weatherImg;

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