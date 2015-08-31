
var map = L.map('map', { editable: true });

$(document).ready(function() { 
    var width = $(window).width();
      if(width <= 800){
                $('#entrymodal').addClass('bottom-sheet');
      }

             
 });





map.on('load', function (e) {
    console.log('load');
    requestPoints(e.target.getBounds());
});

map.setView([15.4, -61.3], 11);


var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib });
osm.addTo(map);



var addEvent = L.Control.extend({
    options: {
        position: 'bottomright'
    },

    onAdd: function (map) {
        // create the control container with a particular class name
        var container = L.DomUtil.create('div', 'add-control');
        L.DomEvent
            .addListener(container, 'click', L.DomEvent.stopPropagation)
            .addListener(container, 'click', L.DomEvent.preventDefault)
            .addListener(container, 'click', function () { map.editTools.startMarker(); });

        // ... initialize other DOM elements, add listeners, etc.
        var button = L.DomUtil.create('a', 'btn-floating btn-large waves-effect waves-light red', container);
        console.info('button', button);
        var icon = L.DomUtil.create('i', 'material-icons', button);
        icon.innerHTML = "add";

        return container;
    }
});

map.addControl(new addEvent());


var tooltip = L.DomUtil.get('tooltip');
function addTooltip(e) {
    L.DomEvent.on(document, 'mousemove', moveTooltip);
    tooltip.innerHTML = 'Click on the map to add an event.';
    tooltip.style.display = 'block';
}
function removeTooltip(e) {
    tooltip.innerHTML = '';
    tooltip.style.display = 'none';
    L.DomEvent.off(document, 'mousemove', moveTooltip);
    enterDetails(e);
}
function moveTooltip(e) {
    tooltip.style.left = e.clientX + 20 + 'px';
    tooltip.style.top = e.clientY - 10 + 'px';
}
function enterDetails(e) {
     $('#entrymodal').openModal();
}
map.on('editable:drawing:start', addTooltip);
map.on('editable:drawing:end', removeTooltip);

 
 
 



function requestPoints(bounds) {
   
    reqwest({
        url: 'http://mapping.site:3000/points'
      , method: 'post'
      , data: bounds
      , error: function(err){console.info('error',err)}
      , success: function (resp) {
          console.info('points gotten',resp);
          L.geoJson(resp
            , {
                
            }).addTo(map);
        }
      });

}
