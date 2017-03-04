var map;

function initMap(){
  map = new google.maps.Map(document.getElementById('map'),{
    center : {lat : 41.3766800 , lng: 2.1895860 },
    zoom : 16
  });
  var home = {lat : 41.3766800 , lng: 2.1895860 };
  var homeMarker = new google.maps.Marker({
    position: home,
    map: map,
    title: 'Home'
  });
  var homeInfoWindow = new google.maps.InfoWindow({
    content: 'This is Home'
  });
  homeMarker.addListener('click', function(){
    homeInfoWindow.open(map,homeMarker);
  })

}
