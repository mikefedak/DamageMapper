
var map = L.map('map', { editable: true });

var editing = false;

$(document).ready(function () {
    var width = $(window).width();
  if (width <= 800) {
    $('#entrymodal').addClass('bottom-sheet');
  }


});





map.on('load', function (e) {
    console.log('load');
    requestPoints(e.target.getBounds());
});

map.setView([15.4, -61.3], 11);

var tilelayer = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { maxZoom: 20, attribution: 'Data \u00a9 <a href="http://www.openstreetmap.org/copyright"> OpenStreetMap Contributors </a> Tiles \u00a9 HOT' }).addTo(map)

var geocoder = L.Control.geocoder({
    collapsed: false,

}).addTo(map);

geocoder.markGeocode = function (result) {
    map.fitBounds(result.bbox);
};

// getting all the markers at once
function getAllMarkers() {

    var allMarkersObjArray = []; // for marker objects
    var allMarkersGeoJsonArray = []; // for readable geoJson markers

    $.each(map._layers, function (index, obj) {

        // remove marker on edit/cancel
        if (obj["editor"]) {
            map.removeLayer(obj);
        }

    })

    console.log(allMarkersObjArray);
};





var addEvent = L.Control.extend({
    options: {
        position: 'bottomright',
        placeholder: 'Press enter to search'
    },

    onAdd: function (map) {
        // create the control container with a particular class name
        var container = L.DomUtil.create('div', 'add-control');
        L.DomEvent
            .addListener(container, 'click', L.DomEvent.stopPropagation)
            .addListener(container, 'click', L.DomEvent.preventDefault)
            .addListener(container, 'click', function () {

      var editMark = map.editTools.startMarker(L.latLng(15, -61));

      editing = true;

      $(document).keyup(function (e) {
        if (e.keyCode == 27) { // escape key maps to keycode `27`
                    editing = false;
                    map.editTools.stopDrawing();

        }
      });


    });


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
    if (editing === true) {
    enterDetails(e);
    }
    getAllMarkers();

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


  function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties) {
            layer.bindPopup(feature.properties.DESCRIPTION);
        }
    };


    reqwest({
        url: 'http://mapping.site:3000/points'
    , method: 'post'
    , data: bounds
    , error: function (err) { console.info('error', err) }
    , success: function (resp) {
      console.info('points gotten', resp.rows[0]);





      L.geoJson(resp.rows[0].row_to_json, {
        pointToLayer: function (feature, latlng) {
                    console.info('image url', feature.properties.IMAGE_URL)
                    if (feature.properties.IMAGE_URL.length > 4) {
                        var ptMarker = L.marker(latlng, {
                            icon: L.icon(L.extend({
                                iconUrl: feature.properties.IMAGE_URL
                            }, {
                                    iconSize: [40, 40],
                                    className: 'leaflet-marker-instagram'
                                })),

                        });
                    } else {
                        var ptMarker = L.marker(latlng, {
                            icon: L.divIcon({
                                iconSize: [40, 40],
                                html: '<span>X</span>'

                            }),

                        });
                    }

                    var imageTemplate = '<a href="{link}" title="View Larger Image"><img src="{image_standard}"/></a><p>Description: {caption}</a></p><p>Source: {attr}</p>'
                        ptMarker.bindPopup(L.Util.template(imageTemplate, { link: feature.properties.IMAGE_URL, 
                            caption: feature.properties.DESCRIPTION, image_standard: feature.properties.IMAGE_URL, attr: feature.properties.Attribution},  
                            {
                                className: 'leaflet-popup-instagram'
                            }));
                        
                        
                    return ptMarker.addTo(map)


        }
            });
        }
  });

}
