  var map;
  var geocoder;
  var filteredlocations = [];
  // Create a new blank array for all the parks markers.
  var markers = [];
  var filteredmarkers = [];
  var selectedmarker = null;
  var bounds;

  
  function initMap() {
    // Create a styles array to use with the map.
    var styles = [
      {
        featureType: 'water',
        stylers: [
          { color: '#19a0d8' }
        ]
      },{
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [
          { color: '#ffffff' },
          { weight: 6 }
        ]
      },{
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [
          { color: '#e85113' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [
          { color: '#efe9e4' },
          { lightness: -40 }
        ]
      },{
        featureType: 'transit.station',
        stylers: [
          { weight: 9 },
          { hue: '#e85113' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [
          { visibility: 'off' }
        ]
      },{
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [
          { lightness: 100 }
        ]
      },{
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
          { lightness: -100 }
        ]
      },{
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
          { visibility: 'on' },
          { color: '#f0e4d3' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [
          { color: '#efe9e4' },
          { lightness: -25 }
        ]
      }
    ];

    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 39.8283, lng: -98.5795},
      zoom: 4,
      styles: styles,
      mapTypeControl: false
    });
    geocoder = new google.maps.Geocoder();
    // These are the real estate parks that will be shown to the user.
    // Normally we'd have these in a database instead.
    

    var largeInfowindow = new google.maps.InfoWindow();

    // Style the markers a bit. This will be our parks marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');
    
    function createMarkers(i){
      // Get the position from the location array.
      var position = locations[i].location;
      var title = locations[i].title;
      var state = locations[i].state;
      // Create a marker per location, and put into markers array.
      var marker = new google.maps.Marker({
        position: position,
        title: title,
        state: state,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        id: i
      });
      // Push the marker to our array of markers.
      markers.push(marker);
      // Create an onclick event to open the large infowindow at each marker.
      marker.addListener('click', function() {
        closeInfowindow(selectedmarker);
        selectedmarker = largeInfowindow;
        setAnimation(marker);
        populateInfoWindow(this, largeInfowindow);
        });
      // Two event listeners - one for mouseover, one for mouseout,
      // to change the colors back and forth.
      marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
      });
      marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
      });
    }
    
    // The following group uses the location array to create an array of markers on initialize.
    filteredmarkers = [];
    for (var i = 0; i < locations.length; i++) {
      createMarkers(i);
      filteredmarkers.push(markers[i]);
    }
    showAllParks(); 
  }
  
  //Ajax call to OpenWeatherMap
  function getWeather(infowindow, marker){
    var position = marker.position;
    var cords = (position+"").split(", ");
    var lat = cords[0].replace("(", "");
    var lng = cords[1].replace(")", "");
    //var data;
    //var infodata = infowindow.getContent();
    //var weatherstr;
    url = "http://api.openweathermap.org/data/2.5/weather?APPID=b36dbbebc9c8e656a80fb8c68f6ec353&" +
    "lat=" + lat + "&" + "lon=" + lng;
    var getStreetView = function(){};
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    getStreetView = function(data, status) {
          //var weatherData = getWeather(marker.position);
          if (status == google.maps.StreetViewStatus.OK) {            
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
              nearStreetViewLocation, marker.position);
              var panoramaOptions = {
                position: nearStreetViewLocation,
                pov: {
                  heading: heading,
                  pitch: 30
                }
              };             
            panorama = new google.maps.StreetViewPanorama(
            document.getElementById("streetpano"), panoramaOptions);  
          } else {
            infowindow.setContent(infowindow.getContent().replace('<div id="nostreetview"></div>','<div id="nostreetpano">No Street View</div>'));
            panorama = new google.maps.StreetViewPanorama(
            document.getElementById("streetpano"), null); 
          }
    };
    
    $.getJSON(url).done(function(data){
      //Temperature unit is Kelvin, needs to convert to F or C
      //F = 9/5 (K - 273) + 32
      //C = K - 273
      temp = ((data.main.temp-273)*9/5+32).toFixed(1);
      weather = data.weather[0].main;
      infowindow.setContent('<div>' + marker.title + '</div>' +
                            '<div id="weather-info">Weather: ' + weather + '</div>' +
                            '<div id="temperature-info">Temperature: ' + temp + 'F </div>' +
                            '<div id="nostreetview"></div>' +
                            '<div id="streetpano"></div>');

        
      streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
      infowindow.open(map, marker);
    }).fail(function(){
       //Handles Weather API ERROR in infowindow.
      infowindow.setContent('<div>' + marker.title + '</div>' +
                            '<div id="weather-error">Weather Data Not Available</div>' +
                            '<div id="nostreetview"></div>' +
                            '<div id="streetpano"></div>');
      streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
      infowindow.open(map, marker);
    });
    
    
  }

   
  // This function populates the infowindow when the marker is clicked. We'll only allow
  // one infowindow which will open at the marker that is clicked, and populate based
  // on that markers position.
  function populateInfoWindow(marker, infowindow) { 
    // Check to make sure the infowindow is not already opened on this marker.
     
    if (infowindow.marker != marker) {
        infowindow.setContent('');
        infowindow.marker = marker;
        infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
        });      
      
      getWeather(infowindow, marker); 
 

       
    }
  }
  
  // This function will loop through the markers array and display them all.
  function showAllParks() {
    bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    map.setCenter({lat: 39.8283, lng: -98.5795});
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
      bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
    map.setZoom(3);
  }

  // This function will loop through the parks and hide them all.
  function hideParks() {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    
  }
   
  /*
  Using dropdown list as the filter
  Returns a list of locations for each "state"
  The FILTERED list will be shown in the 2nd dropdown list.
  */
  function showLocationList(state) {
    filteredlocations = [];
    for (var i = 0; i < locations.length; i++) {
      if (state == "All States" || state == locations[i].state) {
         filteredlocations.push(locations[i].title);
      }   
    }
    return (filteredlocations.length===0)?['No Travelling Park Available']:filteredlocations;
  }
  
  /* PART 1: FILTERING
  Showing makers based on search string "state"
  Setting map without calling search API
  UI : 2nd dropdown list changes accordingly 
  */
  function showStateParks(state) {
    if (state == "All States"){
      hideParks();
      showAllParks();
    } else {
      hideParks();
      filteredmarkers = [];
      //apply filter and show markers
      for (var i = 0; i < markers.length; i++) {
            if (markers[i].state == state)  {
              markers[i].setMap(map);
              filteredmarkers.push(markers[i]);
            } 
      }
      
       
      /* PART 2: CENTER AND ZOOM IN 
      Below code is not part of the filter,
      Code is provided for better user experience.
      1. It searches the state location using GEOCODE,
         And simply center it and zoom in. 
      2. It does not handle any filtering and markers.
      3. It handles when a state has NO markers
      */
      geostring = state + ", US" ;
      geocoder.geocode({'address': geostring}, function(results, status) {
        if (status === 'OK') {
          statelocation = results[0].geometry.location;
          var statebounds = new google.maps.LatLngBounds(statelocation); 
          statebounds.extend(statelocation); 
          map.setCenter(statelocation);
          map.fitBounds(statebounds);
          map.setZoom(6);
        } else {
            alert('Geocode Error Status: ' + status);
          }
        }); //END OF PART 2 
    }
  }

 
  // Make marker and color setting
  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
  }
      
var states = [ "All States",
                      "AK",
                      "AL",
                      "AR",
                      "AS",
                      "AZ",
                      "CA",
                      "CO",
                      "CT",
                      "DC",
                      "DE",
                      "FL",
                      "GA",
                      "GU",
                      "HI",
                      "IA",
                      "ID",
                      "IL",
                      "IN",
                      "KS",
                      "KY",
                      "LA",
                      "MA",
                      "MD",
                      "ME",
                      "MI",
                      "MN",
                      "MO",
                      "MS",
                      "MT",
                      "NC",
                      "ND",
                      "NE",
                      "NH",
                      "NJ",
                      "NM",
                      "NV",
                      "NY",
                      "OH",
                      "OK",
                      "OR",
                      "PA",
                      "PR",
                      "RI",
                      "SC",
                      "SD",
                      "TN",
                      "TX",
                      "UT",
                      "VA",
                      "VI",
                      "VT",
                      "WA",
                      "WI",
                      "WV",
                      "WY"];

var locations = [
          {title: 'Yellowstone National Park', location: {lat: 44.4280, lng: -110.5885}, state: "WY"},
          {title: 'Crater Lake', location: {lat: 42.9446, lng: -122.1090}, state: "OR"},
          {title: 'Grand Canyon National Park', location: {lat: 36.1070, lng: -112.1130}, state: "AZ"},
          {title: 'Yosemite National Park', location: {lat: 37.8651, lng: -119.5383}, state: "CA"},
          {title: 'Great Smoky Mountains National Park', location: {lat: 35.6118, lng: -83.4895}, state: "TN"},
          {title: 'Niagara Falls', location: {lat: 43.0962, lng: -79.0377}, state: "NY"},
          {title: 'Rothrock State Forest', location: { lat:40.720585 , lng: -77.826965 }, state: 'PA'},
          {title: 'Zion National Park', location: { lat:37.317207 , lng: -113.022537 }, state: 'UT'},
          {title: 'Stanislaus National Forest', location: { lat:38.235195 , lng: -120.066483 }, state: 'CA'},
          {title: 'Malibu Creek State Park', location: { lat:34.105156 , lng: -118.731316 }, state: 'CA'},
          {title: 'Manti-La Sal National Forest', location: { lat:39.18705 , lng: -111.37989 }, state: 'UT'},
          {title: 'Cherry Creek State Park', location: { lat:39.639973 , lng: -104.831863 }, state: 'CO'},
          {title: 'Kissimmee Prairie Preserve State Park', location: { lat:27.612417 , lng: -81.053383 }, state: 'FL'},
          {title: 'Garden of Gods', location: { lat:38.87384 , lng: -104.886665 }, state: 'CO'},
          {title: 'Fort Berthold Indian Reservation', location: { lat:47.68388 , lng: -102.354126 }, state: 'ND'},
          {title: 'Chattahoochee National Forest', location: { lat:34.765972 , lng: -84.143517 }, state: 'GA'},
          {title: 'Little Sandy National Wildlife Refuge', location: { lat:32.590797 , lng: -95.273666 }, state: 'TX'},
          {title: 'Siuslaw National Forest', location: { lat:44.358715 , lng: -123.829994 }, state: 'OR'},
          {title: 'Kings Canyon National Park', location: { lat:36.887856 , lng: -118.555145 }, state: 'CA'},
          {title: 'Ruffner Mountain Nature Center', location: { lat:33.55899 , lng: -86.707016 }, state: 'AL'},
          {title: 'Kings Mountain State Park', location: { lat:35.130459 , lng: -81.345444 }, state: 'SC'},
          {title: 'North Maine Woods', location: { lat:46.867702 , lng: -69.480286 }, state: 'ME'},
          {title: 'Oleta River State Park', location: { lat:25.921614 , lng: -80.144402 }, state: 'FL'},
          {title: 'Grant Park', location: { lat:41.876465 , lng: -87.621887 }, state: 'IL'},
          {title: 'Bridge Creek Wildlife Area', location: { lat:45.043449 , lng: -118.949318 }, state: 'OR'},
          {title: 'Willamette National Forest', location: { lat:44.060471 , lng: -122.091736 }, state: 'OR'},
          {title: 'Golden Gate Canyon State Park', location: { lat:39.814339 , lng: -105.4198 }, state: 'CO'},
          {title: 'William F Hayden Green Mountain Park', location: { lat:39.702827 , lng: -105.175636 }, state: 'CO'},
          {title: 'Lantz Farm and Nature Preserve', location: { lat:39.516754 , lng: -80.649948 }, state: 'WV'},
          {title: 'Myakka State Forest', location: { lat:26.988386 , lng: -82.286552 }, state: 'FL'},
          {title: 'Lake Eola Park', location: { lat:28.545021 , lng: -81.372856 }, state: 'FL'},
          {title: 'Gulf State Park', location: { lat:30.262793 , lng: -87.636337 }, state: 'AL'},
          {title: 'Kennesaw Mountain National Battlefield Park', location: { lat:33.976376 , lng: -84.579163 }, state: 'GA'},
          {title: 'Shenandoah National Park', location: { lat:38.700516 , lng: -78.292694 }, state: 'VA'},
          {title: 'Ricketts Glen State Park', location: { lat:41.339184 , lng: -76.290436 }, state: 'PA'},
          {title: 'El Dorado State Park', location: { lat:37.866047 , lng: -96.756935 }, state: 'KS'},
          {title: 'Lake Wateree State Recreation Area', location: { lat:34.375179 , lng: -80.863495 }, state: 'NC'},
          {title: 'National Bison Range', location: { lat:47.342545 , lng: -114.209747 }, state: 'MT'},
          {title: 'Hillman State Park', location: { lat:40.453739 , lng: -80.400864 }, state: 'PA'},
          {title: 'Little Big Econ State Forest', location: { lat:28.673721 , lng: -81.104507 }, state: 'FL'},
          {title: 'Mount Mitchell State Park', location: { lat:35.768803 , lng: -82.306137 }, state: 'NC'} 
        ];

function setAnimation(marker) {
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function(){ marker.setAnimation(null); }, 770);
}

function closeInfowindow(infowindow){
  if (infowindow!==null){
    infowindow.close();
    infowindow.marker = null;
  }
}

function findMarker(markers, location){
  closeInfowindow(selectedmarker);
  for (var i = 0; i < markers.length; i++) {    
    if (markers[i].title == location) {
      var largeInfowindow = new google.maps.InfoWindow();
      selectedmarker = largeInfowindow;
      setAnimation(markers[i]);
      populateInfoWindow(markers[i], largeInfowindow);
    }
  }
}

function mapError(){
  alert('Google Map Error: Check your connectivity and try again');
}

var ViewModel = function(){
    this.stateList = ko.observableArray(states);
    this.selectedState = ko.observable("All States");
    this.selectedLocation = ko.observable();
    //Handle Filter Binding,
    //location dropdown list is bind with State dropdown list
    this.locationNames = ko.computed(function(){       
      var statechoice = this.selectedState();
      return showLocationList (statechoice);
    },this);   
    
    this.showAllParks = showAllParks;
    this.hideParks = hideParks;
    
    this.selectedState.subscribe(function(state) {        
      //IMPORTANT: function parameter should be newstate+"", or its value includes "Object Event"
      showStateParks(state+"");
    }, this);
    
    this.selectedLocation.subscribe(function(location) {        
      findMarker(filteredmarkers, (location+""));
    }, this);
    
    this.ifVisible = ko.computed(function(){
      var statechoice = this.selectedState();
      return (statechoice=="All States")?false:true ;       
    },this);

};    
ko.applyBindings(new ViewModel());
