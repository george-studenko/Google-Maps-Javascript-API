var map;
var polygon=null;

 var MapMarker = function (address, title, description){
  this.title=title;
  this.description=description;
  this.address=address;
  }

var markersViewModel = function(){
  this.markers = [
        new MapMarker("Carrer de Sant Miquel 115, Barcelona","Home","This is Home"),
        new MapMarker("Carrer de Sant Miquel 110, Barcelona","Home 1","This is Home"),
        new MapMarker("Carrer del Mar 15, Barcelona","Home 2","This is Home"),
        new MapMarker("Carrer Judici 15","Home 3","This is Home"),
        new MapMarker("Carrer Judici 5","Home 4","This is Home")
    ];
};


  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingConrolOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      drawingModes:[google.maps.drawing.OverlayType.POLYGON]
    }
  });
  $('#draw').click(function(){
    toggleDrawing(drawingManager);
  });
}


function toggleDrawing(drawingManager){
  if(drawingManager.map){
    drawingManager.setMap(null);
  }else{
    drawingManager.setMap(map);
  }
}
