var mapModel = {
    bounds: null,
    map: null,
    currentInfoWindow: null,
    defaultIcon: 'http://maps.google.com/mapfiles/marker.png',
    wikiIcon: 'images/icons/wiki.png',
    showHideButtonText: ko.observable('Hide Menu'),
};

var mapView = {
    showToast: function(message) {
        var x = document.getElementById("snackbar")
        x.innerHTML = message;
        x.className = "show";
        setTimeout(function() {
            x.className = x.className.replace("show", "");
        }, 3000);
    }
};

var mapViewModel = {
    initMapModel: function() {
        mapModel.bounds = new google.maps.LatLngBounds();
    },
    // handle error
    googleError: function() {
        error = true;
        document.getElementById("loading").style.visibility = 'hidden';
        document.getElementById("loading").style.display = 'none';
        document.getElementById("map").style.display = 'none';
        document.getElementById("weather").style.display = 'none';
        document.getElementById("error").style.visibility = 'visible';
        document.getElementById("error").style.display = 'flex';
    },

    toggleMenu: function() {
        $('#listPanel').toggleClass('showMenu');
        $('#listPanel').toggleClass('hideMenu');

        if (mapModel.showHideButtonText() == "Show Menu") {
            mapModel.showHideButtonText("Hide Menu");
        } else {
            mapModel.showHideButtonText("Show Menu");
        }
    },
};

var wikiNearbyThumbnails = 'https://en.wikipedia.org/w/api.php?action=query&prop=coordinates%7Cpageimages%7Cpageterms&colimit=50&piprop=thumbnail&pithumbsize=270&pilimit=50&wbptterms=description&generator=geosearch&ggscoord=41.3766803%7C2.1873975&ggsradius=800&ggslimit=50&format=json';
var wikiNearbyInfo = 'https://en.wikipedia.org/w/api.php?action=opensearch&prop=revisions&format=json&search=#SEARCH#';

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

var weatherModel = {
    weatherAPIUrl: 'http://api.openweathermap.org/data/2.5/weather?lat=41.3766803&lon=2.1873975&appid=3d33c1f99df80651f8287e66ca51a9cc&units=metric',
    currentWeatherData: ko.observable()
};

var weatherViewModel = {
    getWeather: function() {
        $.ajax({
            url: weatherModel.weatherAPIUrl,
            dataType: 'jsonp'
        }).done(function(desc) {
            var temp = desc.main.temp;
            var humidity = desc.main.humidity;
            var icon = 'http://openweathermap.org/img/w/' + desc.weather[0].icon + '.png';
            var currentCondition = desc.weather[0].description;
            currentCondition = currentCondition.charAt(0).toUpperCase() + currentCondition.slice(1);
            weatherModel.currentWeatherData('<img src=' + icon + '><br>' + currentCondition + '<br>Temp: ' + temp + ' &deg;C<br>Humidity: ' + humidity + '%');
        }).fail(function() {
            weatherModel.currentWeatherData('An error occurred when trying to load the current weather conditions.');
            mapView.showToast("An error occurred when trying to load the current weather conditions");
        });
    }
};

var MapMarker = function(address, title, description, visible, map, lat, lon, type, heading, marker = null) {
    this.title = title;
    this.description = description;
    this.address = address;
    this.isVisible = ko.observable(visible);
    this.map = map;
    this.markerIndex = -1;
    this.lat = lat;
    this.lon = lon;
    this.type = type;
    this.marker = marker;
    this.infowindow = null;
    this.heading = heading;
    this.icon = 'http://maps.google.com/mapfiles/marker.png';
};

MapMarker.prototype.placeMarkerFromAddress = function(index) {
    var marker = this;
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
            address: marker.address
        },
        function(results, status) {
            var lat = 0;
            if (status == google.maps.GeocoderStatus.OK) {
                var position = {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                };
                var newMarker = new google.maps.Marker({
                    position: position,
                    map: mapModel.map,
                    animation: google.maps.Animation.DROP,
                    title: marker.title,
                    icon: mapModel.defaultIcon
                });
                // extend bounds and set the proper zoom and center to show all markers
                mapModel.bounds.extend(position);
                marker.fitBounds();
                var image = encodeURI('https://maps.googleapis.com/maps/api/streetview?size=300x300&location=' + marker.address + '&heading=' + marker.heading + '&pitch=10');
                var infoWindow = new google.maps.InfoWindow({
                    maxWidth: 300,
                    content: '<h2>' + marker.title + '</h2><div><img src=' + image + '></div>' + marker.description
                });
                marker.infowindow = infoWindow;
                newMarker.addListener('click', function() {
                    marker.openInfoWindow();
                    marker.toggleAnimation();
                })
                marker.marker = newMarker;
                marker.markerIndex = index;
            } else {
                mapView.showToast("Some Markers could not be loaded");
            }
        })
};

MapMarker.prototype.placeMarkerFromLatLon = function(index) {
    var marker = this;
    var position = {
        lat: marker.lat,
        lng: marker.lon
    };
    var newMarker = new google.maps.Marker({
        position: position,
        map: mapModel.map,
        animation: google.maps.Animation.DROP,
        title: marker.title,
        icon: mapModel.wikiIcon
    });
    // extend bounds and set the proper zoom and center to show all markers
    mapModel.bounds.extend(position);
    marker.fitBounds();
    var infoWindow = new google.maps.InfoWindow({
        maxWidth: 300,
        content: '<h2>' + marker.title + '</h2><div>' + marker.description + '</div>'
    });
    marker.infowindow = infoWindow;
    newMarker.addListener('click', function() {
        marker.openInfoWindow();
        marker.toggleAnimation();
    })
    marker.marker = newMarker;
    marker.markerIndex = index;
};

MapMarker.prototype.focusMarker = function() {
    var marker = markersModel.mapMarkers()[this.markerIndex].marker;
    marker.setAnimation(google.maps.Animation.DROP);
    var latLng = marker.getPosition();
    mapModel.map.panTo(latLng);
    this.openInfoWindow();
};

MapMarker.prototype.openInfoWindow = function() {
    var marker = markersModel.mapMarkers()[this.markerIndex].marker;
    var infoWindow = markersModel.mapMarkers()[this.markerIndex].infowindow;
    mapModel.map.panTo(marker.getPosition());
    // close current infowindow open if any
    if (mapModel.currentInfoWindow) {
        mapModel.currentInfoWindow.close();
    }
    // set the new current Open infowindow and open it
    mapModel.currentInfoWindow = infoWindow;
    infoWindow.open(mapModel.map, marker);
};

MapMarker.prototype.fitBounds = function() {
    mapModel.map.fitBounds(mapModel.bounds);
};

MapMarker.prototype.toggleAnimation = function() {
    var marker = markersModel.mapMarkers()[this.markerIndex].marker;
    // enable animation
    if (marker.getAnimation() == null) {
        marker.setAnimation(google.maps.Animation.BOUNCE);


    }
    // disable animation
    else {
        marker.setAnimation(null);
        //marker.setIcon('http://maps.google.com/mapfiles/marker.png')
    }
};

var markersModel = {
    mapMarkers: ko.observableArray([
        new MapMarker("Carrer de Andrea Doria 6-2, Barcelona", "Market", "This is the Barceloneta Market", true, mapModel.map, null, null, null, 300),
        new MapMarker("Carrer Sant Miquel Platja, 10", "Sant Miquel Beach", "This is one of the many beaches in the neighborhood", true, mapModel.map, null, null, null, 100),
        new MapMarker("Hospital del Mar, 08003 Barcelona", "Hospital del Mar", "Hospital", true, mapModel.map, null, null, null, 280),
        new MapMarker("Paseo de Juan de Borbón, 2", "Burguer King", "Fast Food Place 24 hours", true, mapModel.map, null, null, null, 350),
        new MapMarker("Judici 8, Barcelona", "Forn de Pa Motserrat", "Bakery", true, mapModel.map, null, null, null, 100)

    ]),

    getMapMarkers: function() {
        return markersModel.mapMarkers;
    },
};
var markersView = {
    renderMarkers: function() {
        for (var i = 0; i < markersModel.mapMarkers().length; i++) {
            if (markersModel.mapMarkers()[i].type == null) {
                markersModel.mapMarkers()[i].placeMarkerFromAddress(i);
            }
        }
    },

    showMenuFirstTime: function() {
        $('#listPanel').css('transform', '');
        $('.menu').css('transform', '');
    },

    renderWikiMarkers: function() {
        for (var i = 0; i < markersModel.mapMarkers().length; i++) {
            if (markersModel.mapMarkers()[i].type == 'wiki') {
                markersModel.mapMarkers()[i].placeMarkerFromLatLon(i);
            }
        }
    }
};
var markersViewModel = {
    filterResults: function(data) {
        for (var i = 0; i < markersModel.mapMarkers().length; i++) {
            if (markersModel.mapMarkers()[i].title.toLowerCase().includes(markersViewModel.searchTerm().toLowerCase())) {
                markersModel.mapMarkers()[i].isVisible(true);
                markersModel.mapMarkers()[i].marker.setVisible(true);
            } else {
                markersModel.mapMarkers()[i].isVisible(false);
                markersModel.mapMarkers()[i].marker.setVisible(false);
            }
        }
    },

    loadGooglePlaces: function() {
        var request = {
            location: new google.maps.LatLng(41.3766803, 2.1873975),
            radius: '900',
            types: ['store', 'hospital', 'park', 'school', 'library', 'bank', 'police', 'gym']
        };

        var service = new google.maps.places.PlacesService(mapModel.map);
        service.nearbySearch(request, function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                markersViewModel.createPlacesMarkers(results);
            }
        });
    },

    createPlacesMarkers: function(places) {
        var bounds = new google.maps.LatLngBounds();
        var placesList = document.getElementById('places');
        var service = new google.maps.places.PlacesService(mapModel.map);

        for (var i = 0, place; place = places[i]; i++) {
            var image = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };

            var photos = place.photos;
            var bigPhoto = '';
            if (photos) {
                image = photos[0].getUrl({
                    'maxWidth': 35,
                    'maxHeight': 35
                });
                bigPhoto = photos[0].getUrl({
                    'maxWidth': 300,
                    'maxHeight': 300
                });
            }

            var marker = new google.maps.Marker({
                map: mapModel.map,
                icon: image,
                title: place.name,
                position: place.geometry.location
            });

            var infowindow = new google.maps.InfoWindow({
                maxWidth: 300
            });
            var type = capitalize(place.types[0]).replace(/_/g, ' ');
            var innerHtml = '';

            if (bigPhoto != '') {
                innerHtml = innerHtml + '<div><img src="' + bigPhoto + '"></div>';
            }

            if (place.types) {
                innerHtml = innerHtml + '<b>' + type + '</b>: ' + place.name;
            }

            if (place.rating) {
                innerHtml = innerHtml + ' (' + place.rating + '&starf;)';
            }

            if (place.vicinity) {
                innerHtml = innerHtml + '<br><b>Address</b>: ' + place.vicinity;
            }

            infowindow.setContent(innerHtml);

            var index = markersModel.mapMarkers.push(new MapMarker(null, type + ': ' + place.name, image, true, mapModel.map, place.geometry.lat, place.geometry.lng, 'places')) - 1;
            markersModel.mapMarkers()[index].marker = marker;
            markersModel.mapMarkers()[index].markerIndex = index;
            markersModel.mapMarkers()[index].infowindow = infowindow;

            // need to use a closure here to set the correct index
            marker.addListener('click', (function(indexCopy) {
                return function() {
                    markersModel.mapMarkers()[indexCopy].openInfoWindow();
                    markersModel.mapMarkers()[indexCopy].toggleAnimation();
                };
            })(index));
            bounds.extend(place.geometry.location);
        }
        mapModel.map.fitBounds(bounds);
    },

    // search box
    searchTerm: ko.observable(""),

    placeWikipediaMarkers: function() {
        $.ajax({
            url: wikiNearbyThumbnails,
            dataType: 'jsonp'
        }).done(function(data) {
            var lat = 'lat';
            var lon = 'lon';
            var coord = 'coordinates';
            var thumb = 'thumbnail';

            var items = data.query.pages;
            Object.keys(items).forEach(function(key) {
                var wikiMarkers = items[key][coord];
                var wikiThumbs = items[key][thumb];

                function composeDescription(title, description, image, link) {
                    return '<a href="' + link + '">' + title + '</a>' + image + description;
                }

                for (var i = 0; i < wikiMarkers.length; i++) {
                    var thumbImage = '';
                    if (wikiThumbs != null) {
                        thumbImage = "<div><img src=" + wikiThumbs['source'] + "></div>";
                    } else {
                        // if there is no thumbnail do not add the marker
                        return;
                    }
                    markersModel.mapMarkers.push(new MapMarker(null, items[key]['title'], thumbImage, true, mapModel.map, wikiMarkers[i][lat], wikiMarkers[i][lon], 'wiki'));
                }
                var urlInfo = encodeURI(wikiNearbyInfo.replace('#SEARCH#', items[key]['title']));
                $.ajax({
                    url: urlInfo,
                    dataType: 'jsonp'
                }).done(function(desc) {
                    markersModel.mapMarkers()[markersModel.mapMarkers().length - 1].description = desc[2];
                }).fail(function() {
                    mapView.showToast('An error occurred when trying to load some Wikipedia Markers.');
                });;

            });
            markersView.renderWikiMarkers();
        }).fail(function() {
            mapView.showToast('An error occurred when trying to load some Wikipedia Markers.');
        });;
    }
};

function initializate() {
    mapViewModel.initMapModel();
    markersView.renderMarkers();
    markersViewModel.placeWikipediaMarkers();
    weatherViewModel.getWeather();
    markersViewModel.loadGooglePlaces();
    markersView.showMenuFirstTime();
}

ko.applyBindings(markersViewModel);
