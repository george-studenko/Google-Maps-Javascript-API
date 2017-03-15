var map;
var polygon= null;
var allMarkers = [];

 var MapMarker = function (address, title, description, visible,map){
    this.title=title;
    this.description=description;
    this.address=address;
    this.isVisible = visible;
    this.map = map;
    this.markerIndex=-1;
  }

  MapMarker.prototype.placeMarker = function(){
    var marker = this;
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({address: marker.address},
    function (results,status){
        var lat=0;
        if (status == google.maps.GeocoderStatus.OK){
            var position = {lat : results[0].geometry.location.lat() , lng: results[0].geometry.location.lng()};
            var newMarker = new google.maps.Marker({
              position: position,
              map: map,
              title: marker.title
            });
            var image=  encodeURI('https://maps.googleapis.com/maps/api/streetview?size=320x240&location='+marker.address+'&fov=280&pitch=10');
            var infoWindow = new google.maps.InfoWindow({
              content:  '<h2>'+marker.title+'</h2><div><img src='+image+'></div>' + marker.description
            });
            newMarker.addListener('click', function(){
              infoWindow.open(map,newMarker);
            })
          }
        })
        };

var markersViewModel = {
  markers : ko.observableArray([
        new MapMarker("Carrer de Sant Miquel 115, Barcelona","Home","This is Home",true,null),
        new MapMarker("Almiral Cervera, Barcelona","Pharmacy","Drug Store",true,null),
        new MapMarker("Plaza de Mar, Barcelona","Buenas Migas","Bar",true,null),
        new MapMarker("Paseo de Juan de Borbón, 2","Burguer King","Hamburguers Place",true,null),
        new MapMarker("Judici 8, Barcelona","Forn de Pa Motserrat","Bakery",true,null)
    ]),

    filterResults : function(data){
      for(var i=0; i<markersViewModel.markers().length ; i++){
        if(markersViewModel.markers()[i].title.includes(markersViewModel.searchTerm())){
          markersViewModel.markers()[i].isVisible=true;
          allMarkers[i].setMap(map);          
        }else{
          markersViewModel.markers()[i].isVisible=false;
          allMarkers[i].setMap(null);
        }
      }
    },
    searchTerm : ko.observable("")
};

  for(var i=0; i<markersViewModel.markers().length ; i++){
    markersViewModel.markers()[i].placeMarker();
  }

var drawingManager = new google.maps.drawing.DrawingManager({
  drawingMode: google.maps.drawing.OverlayType.POLYGON,
  drawingControl: true,
  drawingConrolOptions: {
    position: google.maps.ControlPosition.TOP_LEFT,
    drawingModes:[google.maps.drawing.OverlayType.POLYGON]
  }
});

function toggleDrawing(drawingManager){
  if(drawingManager.map){
    drawingManager.setMap(null);
  }else{
    drawingManager.setMap(map);
  }
}

  $('#draw').click(function(){
    toggleDrawing(drawingManager);
  });

  ko.applyBindings(markersViewModel);
