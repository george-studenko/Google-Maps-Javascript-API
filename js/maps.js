var map;
var polygon=null;

 var MapMarker = function (address, title, description){
  this.title=title;
  this.description=description;
  this.address=address;
  }

var markersViewModel = {
  markers : ko.observableArray([
        new MapMarker("Carrer de Sant Miquel 115, Barcelona","Home","This is Home"),
        new MapMarker("Almiral Cervera, Barcelona","Pharmacy","Drug Store"),
        new MapMarker("Plaza de Mar, Barcelona","Buenas Migas","Bar"),
        new MapMarker("Paseo de Juan de Borbón, 2","Burguer King","Hamburguers Place"),
        new MapMarker("Judici 8, Barcelona","Forn de Pa Motserrat","Bakery")
    ]),
    search : ko.observable("Home")
};


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
