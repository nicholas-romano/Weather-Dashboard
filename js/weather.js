const API_KEY = '9f980e55608955868186255093b7d703';
var queryURL = "";
var cityDataObj = {};
var citiesData = [];

$( document ).ready(function() {

    var totalCities = window.localStorage.length;

    //If there is local storage data, display it:
    if (totalCities > 0) {

      for (var i = 0; i < totalCities; i++) {

        //loop through all local storage keys:
        var cityName = window.localStorage.key(i);
        
        //ignore the "active" localStorage key:
        if (cityName !== "active") {

          //store each city's data object in the citiesData array:
          var cityData = getData(cityName);
          citiesData.push(cityData);

        }
        
      }

      //display last searched city:
      var activeCity = getData("active");
      displaySearchHistoryItem(activeCity);

      console.log("citiesData: ", citiesData);

      $('#search-section').append('<div class="card">' +
                                    '<ul id="search-history" class="list-group list-group-flush">' +
                                    '</ul>' +
                                  '</div>');

      //loop through each city's data object in the citiesData array and output
      //the city name into the search history list:                              
      $.each(citiesData, function(index, city) {

        addSearchHistoryListItem(city.name);

      });
    }

    //add a click event to each search history city in the list:
    $(".search-history-item").on("click", handleSearchItemSelect);
    
    $("#search-city-name").on("click", function() {

        emptySearchDisplay();

        //get the input submitted:
        var city = $("#city-input").val();
        
        if (city === "") {
          alert("Please enter a City name.");
        }
        else {
            queryURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=Imperial&appid=' + API_KEY; 

            $.ajax({
              url: queryURL,
              method: "GET",
              success: setTodaysForecast,
              error: function() {
                //City not found in the database, output error:
                $("#forecast-today").html('<h4>City name not found!</h4>')
              }
            });
        }  

    });

});

function emptySearchDisplay() {
  //remove previously searched display data:
  $("#forecast-today").empty();
  $("#forecast-heading").empty();
  $("#forecast-tiles").empty();
}

function handleSearchItemSelect() {
  //City name in search history list is selected:
  emptySearchDisplay();
  var city = $(this).attr("id");
  console.log("city: " + city);
  displaySearchHistoryItem(city);
}

function checkForDuplicate(city) {

  var totalCities = window.localStorage.length;

  var cityExists = false;

  for (var i = 0; i < totalCities; i++) {

    var cityData = getData(city);

    if (cityData === null) {
      cityExists = false;
    }
    else {
      cityExists = true;
    }

  }
  return cityExists;

}

function addSearchHistoryListItem(city) {

  var totalCities = window.localStorage.length;

  if (totalCities === 0) {
    $('#search-section').append('<div class="card">' +
      '<ul id="search-history" class="list-group list-group-flush">' +
      '</ul>' +
    '</div>');
  }

  $("#search-history").append('<li id="' + city + '" class="list-group-item search-history-item">' + city + '</li>');
  $(".search-history-item").on("click", handleSearchItemSelect);
}

function displaySearchHistoryItem(cityName) {

  setData("active", cityName);

  cityDataObj = getData(cityName);
  console.log("cityDataObj: ", cityDataObj);

  for (var property in cityDataObj){
    if(cityDataObj.hasOwnProperty(property)){

      //check if the city data object has 5 day forecast data:
      if (property === "forecast_day_1") {
        //if it has 5 day forecast data, add the heading:
        $("#forecast-heading").text("5 Day Forecast");
      }

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
        case 'uv_scale_color':
          var uv_scale_color = cityDataObj[property];
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
  addTodaysForecast(name, date, img, alt, temp, hum, wind_speed, uv_index, uv_scale_color);
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

}

function setUVIndex(lat, lon, cityDataObj, city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed) {

    var queryURL = "http://api.openweathermap.org/data/2.5/uvi?appid=" + API_KEY + "&lat=" + lat + "&lon=" + lon;

    $.ajax({
        url: queryURL,
        method: "GET",
        success: function(response) {
          console.log("UV Index: ", response);
          var uv_index = response.value;
          var uv_scale_color = getUVScaleColor(uv_index);
          cityDataObj["uv_index"] = uv_index;
          cityDataObj["uv_scale_color"] = uv_scale_color;
          getNext5Days(city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed, uv_index, uv_scale_color);
        },
        error: function() {
            //UV index is not available:
            $("#uv_index").text("Not available");
        }     
    });
}

function getNext5Days(city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed, uv_index, uv_scale_color) {

  addTodaysForecast(city_name, todays_date, weatherSrc, weatherAlt, temp, hum, wind_speed, uv_index, uv_scale_color);

    var queryURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + city_name + "&units=Imperial&appid=" + API_KEY;

    $.ajax({
        url: queryURL,
        method: "GET",
        success: get5DayForecastData,
        error: function() {
          $("#forecast-heading").text("5 Day Forecast is not available");

          var cityExists = checkForDuplicate(city_name);

          if (cityExists === false) {
            addSearchHistoryListItem(city_name);
          }
          citiesData.push(cityDataObj);
          setData(city_name, cityDataObj);
          setData("active", city);
        }  
    });

}

function get5DayForecastData(response) {

          $("#forecast-heading").text("5 Day Forecast");

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

          var city = cityDataObj["name"];

          //check if the search term was previously entered:
          var cityExists = checkForDuplicate(city);

          //if the search term was not entered, add it to the search history list:
          if (cityExists === false) {
            addSearchHistoryListItem(city);
          }
          //when all the data is displayed successfully, save the data to local storage:
          setData(city, cityDataObj);
          setData("active", city);
          citiesData.push(cityDataObj);

}

function addTodaysForecast(name, date, src, alt, temp, hum, wind_speed, uv_index, uv_scale_color) {
    $("#forecast-today").html('<div class="card">' +
                                '<div class="card-body">' +
                                  '<h3 class="card-title"><span id="name">' + name + '</span> <span id="date">' + date + '</span><img id="weather-img" title="' + alt + '" src="' + src + '" alt="' + alt + '"></h3>' +
                                  '<p class="card-subtitle mb-2 text-muted">Temperature: <span id="temperature">' + temp + '</span>°F</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">Humidity: <span id="humidity">' + hum + '</span>%</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">Wind Speed: <span id="wind_speed">' + wind_speed + '</span> MPH</p>' +
                                  '<p class="card-subtitle mb-2 text-muted">UV Index: <span class="badge badge-' + uv_scale_color + '" title="' + uv_scale_color + '" id="uv_index">' + uv_index + '</span></p>' +
                                '</div>' +
                              '</div>');
                           
}

function addForecastTile(date, src, alt, temp, hum) {
  $("#forecast-tiles").append('<div class="col-lg-3 col-md-4 col-sm-6">' +
                                '<div class="card">' +
                                    '<div class="card-body">' +
                                      '<h5 class="card-title forecast-date">' + date + '</h5>' +
                                      '<img id="weather-img" width="30" title="' + alt + '" src="' + src + '" alt="' + alt + '">' +
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

function getUVScaleColor(uv_index) {

  //convert the uv index to a number:
  var uvNum = parseFloat(uv_index);

  var uv_scale_color;

  if (uvNum >= 8) {
    //UV index is dangerous
    uv_scale_color = 'extreme';
  }
  else if (uvNum >= 6) {
    //UV index is high"
    uv_scale_color = 'high';
  }
  else if (uvNum >= 3) {
    //"UV index is moderate"
    uv_scale_color = 'moderate';
  }
  else {
    //"UV index is light"
    uv_scale_color = 'light';
  }

  return uv_scale_color;

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