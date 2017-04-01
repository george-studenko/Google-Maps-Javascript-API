var map;
var polygon= null;
var currentInfoWindow;
var bounds = new google.maps.LatLngBounds();
var wikiNearbyThumbnails = 'https://en.wikipedia.org/w/api.php?action=query&prop=coordinates%7Cpageimages%7Cpageterms&colimit=50&piprop=thumbnail&pithumbsize=270&pilimit=50&wbptterms=description&generator=geosearch&ggscoord=41.3766803%7C2.1873975&ggsradius=500&ggslimit=50&format=json';
var wikiNearbyInfo = 'https://en.wikipedia.org/w/api.php?action=opensearch&prop=revisions&format=json&search=#SEARCH#';

var weatherView = {
  currentWeatherElement : $('.currentWeather')
}

var weatherModel = {
   weatherAPIUrl : 'http://api.openweathermap.org/data/2.5/weather?lat=41.3766803&lon=2.1873975&appid=3d33c1f99df80651f8287e66ca51a9cc&units=metric',
   currentWeatherData : ko.observable()
}

var weatherViewModel = {
    getWeather : function(){
      //weatherView.currentWeatherElement().appen
    }
}

 var MapMarker = function (address, title, description, visible, map, lat, lon, type){
    this.title=title;
    this.description=description;
    this.address=address;
    this.isVisible = ko.observable(visible);
    this.map = map;
    this.markerIndex=-1;
    this.lat = lat;
    this.lon = lon;
    this.type = type;
    this.marker = null;
    this.infowindow = null;
  }

  MapMarker.prototype.placeMarkerFromAddress = function(index){
    var marker = this;
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({address: marker.address},
        function (results,status){
            var lat=0;
            if (status == google.maps.GeocoderStatus.OK){
                var position = {lat : results[0].geometry.location.lat() , lng: results[0].geometry.location.lng()};
                var newMarker = new google.maps.Marker({
                  position: position,
                  map: marker.map,
                  animation: google.maps.Animation.DROP,
                  title: marker.title
                });
                // extend bounds and set the proper zoom and center to show all markers
                bounds.extend(position);
                marker.fitBounds();
                var image = encodeURI('https://maps.googleapis.com/maps/api/streetview?size=320x240&location='+marker.address+'&fov=280&pitch=10');
                var infoWindow = new google.maps.InfoWindow({
                  content:  '<h2>'+marker.title+'</h2><div><img src='+image+'></div>' + marker.description
                });
                marker.infowindow=infoWindow;
                newMarker.addListener('click', function(){
                  marker.openInfoWindow();
                })
                marker.marker=newMarker;
                marker.markerIndex=index;
              }
            })
          }

          MapMarker.prototype.placeMarkerFromLatLon = function(index){
            var marker = this;
            var position = {lat : marker.lat , lng: marker.lon};
            var newMarker = new google.maps.Marker({
              position: position,
              map: marker.map,
              animation: google.maps.Animation.DROP,
              title: marker.title,
              icon: 'images/icons/wiki.png'
            });
            // extend bounds and set the proper zoom and center to show all markers
            bounds.extend(position);
            marker.fitBounds();
            var infoWindow = new google.maps.InfoWindow({
              content:  '<h2>'+marker.title+'</h2><div>'+marker.description+'</div>'
            });
            marker.infowindow=infoWindow;
            newMarker.addListener('click', function(){
              marker.openInfoWindow();
            })
            marker.marker=newMarker;
            marker.markerIndex=index;
        };

        MapMarker.prototype.focusMarker =  function(){
          var marker = markersModel.mapMarkers()[this.markerIndex].marker;
          var latLng = marker.getPosition();
          map.panTo(latLng);
          this.openInfoWindow();
        };

        MapMarker.prototype.openInfoWindow = function(){
          var marker = markersModel.mapMarkers()[this.markerIndex].marker;
          var infoWindow = markersModel.mapMarkers()[this.markerIndex].infowindow;
          map.panTo(marker.getPosition());
          // close current infowindow open if any
          if (currentInfoWindow){
            currentInfoWindow.close();
          }
          // set the new current Open infowindow and open it
          currentInfoWindow = infoWindow;
          infoWindow.open(map,marker);
        };

        MapMarker.prototype.fitBounds = function(){
          map.fitBounds(bounds);
        };

        MapMarker.prototype.toggleAnimation = function(){
          var marker = markersModel.mapMarkers()[this.markerIndex].marker;
          // enable animation
          if(marker.getAnimation()==null){
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
        // disable animation
        else{
          marker.setAnimation(null);
        }
        };

var markersViewModel = {
  markers : ko.observableArray([
        new MapMarker("Carrer de Sant Miquel 115, Barcelona","Home","This is Home",true,map,null,null,null),
        new MapMarker("Almiral Cervera, Barcelona","Pharmacy","Drug Store",true,map,null,null,null),
        new MapMarker("Plaza de Mar, Barcelona","Buenas Migas","Bar",true,map,null,null,null),
        new MapMarker("Paseo de Juan de Borbón, 2","Burguer King","Hamburguers Place",true,map,null,null,null),
        new MapMarker("Judici 8, Barcelona","Forn de Pa Motserrat","Bakery",true,map,null,null,null)
    ]),

    filterResults : function(data){
      for(var i=0; i<markersModel.mapMarkers().length ; i++){
        if(markersModel.mapMarkers()[i].title.toLowerCase().includes(markersViewModel.searchTerm().toLowerCase())){
          markersModel.mapMarkers()[i].isVisible(true);
          markersModel.mapMarkers()[i].marker.setVisible(true);
        }else{
          markersModel.mapMarkers()[i].isVisible(false);
          markersModel.mapMarkers()[i].marker.setVisible(false);
        }
      }
    },
    // search box
    searchTerm : ko.observable(""),

    placeWikipediaMarkers : function(){
      var wikiRequestTimeout = setTimeout (function(){
      alert("Error trying to load info from Wikipedia");
      },9000);

      $.ajax({
        url: wikiNearbyThumbnails,
        dataType: 'jsonp'
      }).done(function(data){
        var lat = 'lat';
        var lon = 'lon';
        var coord = 'coordinates';
        var thumb = 'thumbnail';

        var items = data.query.pages;
        Object.keys(items).forEach(function (key) {
          var wikiMarkers = items[key][coord];
          var wikiThumbs = items[key][thumb];
          for(var i=0; i< wikiMarkers.length; i++){
            var thumbImage = '' ;
            if(wikiThumbs!=null){
                thumbImage= "<img src="+wikiThumbs['source']+">";
            }
            markersViewModel.markers.push(new MapMarker(null,items[key]['title'],thumbImage,true,map,wikiMarkers[i][lat],wikiMarkers[i][lon],'wiki'));
          }
        });
            clearTimeout(wikiRequestTimeout);
            for(var i=0; i<markersViewModel.markers().length ; i++){
              markersViewModel.markers()[i].placeMarker();
            }
      });
    }
};
  markersViewModel.placeWikipediaMarkers();


var drawingManager = new google.maps.drawing.DrawingManager({
  drawingMode: google.maps.drawing.OverlayType.POLYGON,
  drawingControl: true,
  drawingConrolOptions: {
    position: google.maps.ControlPosition.TOP_LEFT,
    drawingModes:[google.maps.drawing.OverlayType.POLYGON]
  }
});

function toggleDrawingManager(drawingManager){
  if(drawingManager.map){
    drawingManager.setMap(null);
  }else{
    drawingManager.setMap(map);
  }
}

  $('#draw').click(function(){
    toggleDrawingManager(drawingManager);
  });

  ko.applyBindings(markersViewModel);
