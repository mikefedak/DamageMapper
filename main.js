
var map = L.map('map', { editable: true });

var editing = false;
var imgLink="http://localhost/api/uploads/notfound.jpg";
var siteUrl="http://localhost";
var markers = new L.layerGroup();

$(document).ready(function () {
    var width = $(window).width();
  if (width <= 800) {
    $('#entrymodal').addClass('bottom-sheet');

  }


});


var fullImg = null,
thumbnail =null,
selectedCoords = null;



map.on('load', function (e) {

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
function removeMarkers(params) {

   
    $.each(map._layers, function (index, obj) {

        
        if(params==="editable"){
            // remove marker on edit/cancel
            if (obj["editor"]) {
                map.removeLayer(obj);
            }
        } 
        

    })


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
    removeMarkers("editable");

}
function moveTooltip(e) {
    tooltip.style.left = e.clientX + 20 + 'px';
    tooltip.style.top = e.clientY - 10 + 'px';
}

map.on('editable:drawing:start', addTooltip);
map.on('editable:drawing:end', removeTooltip);

function enterDetails(e) {

  selectedCoords = 'POINT('+e.layer._latlng.lng+' '+e.layer._latlng.lat+')';
  $('#entrymodal').openModal({
      dismissible: true, // Modal can be dismissed by clicking outside of the modal
      ready: function() { }, // Callback for Modal open
      complete: function() {    
          // reset form fields 
           $('#data')[0].reset();
           $('#messages').empty();
           $('#takePictureField').val("");
        } 
    });
}

$("#save-btn").click(function(){
    $( "#messages" ).append('Saving Features'); 
    $("#messages").show();
    

    
    var imgURL= $("#imageLink").val();


    if (imgURL !== null && typeof imgURL !=="undefined" && imgURL.length>0){
          var img = new Image();

          img.onload = function(e) {
          fullImg = resizeImage(img,600);
          thumbnail = resizeImage(img,40);  
              
          var ckVal = [];
        $('#checkboxes input:checked').each(function() {
            ckVal.push(this.value);
        });
              
          var requestData = {
                  'image_link': $('#imageLink').val(),
                  'attribution': $('#attr').val(),
                  'description': $('#desc').val(),
                  'eventType': ckVal.toString(),
                  'thumbnail': thumbnail,
                  'full_image':fullImg,
                  'geom':selectedCoords
                  };


              

                reqwest({

                  url: siteUrl+':3000/uploads'
                , method: 'post'
                , data: requestData
                , error: function (err) { 
                        $('#messages').empty();
                        $( "#messages" ).append('Error: '+err); 
                     }
                , success: function (resp) {

                    $('#entrymodal').closeModal();
                      markers.clearLayers();
                    requestPoints();
                }
                 });
              
          };
              img.crossOrigin = 'anonymous';
              img.src = imgURL;
    }  else {

                       
         var ckVal = [];
        $('#checkboxes input:checked').each(function() {
            ckVal.push(this.value);
        });
        


                var requestData = {
                  'image_link': $('#imageLink').val(),
                  'attribution': $('#attr').val(),
                  'description': $('#desc').val(),
                  'eventType': ckVal.toString(),
                  'thumbnail': thumbnail,
                  'full_image':fullImg,
                  'geom':selectedCoords
                  };


              

                reqwest({

                  url: siteUrl+':3000/uploads'
                , method: 'post'
                , data: requestData
                , error: function (err) {             
                    $('#messages').empty(); $( "#messages" ).append('Error: '+err); 
                 }
                , success: function (resp) {

                     $('#entrymodal').closeModal();
                      markers.clearLayers();

                      requestPoints();
                }
                 });
    } 
    
   
    
   
});








$("#imageLink").change(function(){
    $("#takePictureField").prop('disabled',true);
})


//If uploading file 
$("#takePictureField").change(function(url){
    
    // Read in file
    var file = event.target.files[0];
    processImage(file);
    
    $("#imageLink").prop('disabled',true);

   
});



var processImage = function(file){


     if(file.type.match(/image.*/)) {

        // Load the image
        var reader = new FileReader();
        reader.onload = function (readerEvent) {
            var image = new Image();

            image.onload = function (imageEvent) {


                fullImg = resizeImage(image,600);
                thumbnail = resizeImage(image,40);

                                
            }
            image.src = readerEvent.target.result;
        }
        reader.readAsDataURL(file);
    }
}

var resizeImage = function(image,size){

    
       var canvas = document.createElement('canvas'),
                    max_size = size,
                    width = image.width,
                    height = image.height;
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                var dataUrl = canvas.toDataURL('image/jpeg'); //creates base64 image string
                var resizedImage = dataURLToBlob(dataUrl);
                
                return dataUrl;


}

/* Utility function to convert a canvas to a BLOB */
var dataURLToBlob = function(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = parts[1];

        return new Blob([raw], {type: contentType});
    }

    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
}
/* End Utility function to convert a canvas to a BLOB      */


function requestPoints(bounds) {




  function onEachFeature(feature, layer) {

        if (feature.properties) {
            layer.bindPopup(feature.properties.DESCRIPTION);
        }
    };


    reqwest({

      url: siteUrl+':3000/points'
    , method: 'post'
    , data: bounds
    , error: function (err) { console.info('error', err) }
    , success: function (resp) {
    


      L.geoJson(resp.rows[0].row_to_json, {
        pointToLayer: function (feature, latlng) {
                    
                    
                    if (feature.properties.THUMB_URL){
                        imgLink=feature.properties.THUMB_URL
                    }

                    if (feature.properties.IMAGE_URL.length > 4) {
                        var ptMarker = L.marker(latlng, {
                            icon: L.icon(L.extend({
                                iconUrl: imgLink
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

                    var imageTemplate = '<a href="{link}" title="View Larger Image"><img src="{image_standard}"/></a><p>Description: {caption}</a></p><p>Source: {attr}</p><p>Events: {event}</p>'
                        ptMarker.bindPopup(L.Util.template(imageTemplate, { link: feature.properties.SOURCE_URL, 
                            caption: feature.properties.DESCRIPTION, image_standard: feature.properties.IMAGE_URL,event: feature.properties.EVENT, attr: feature.properties.ATTRIBUTION},  
                            {
                                className: 'leaflet-popup-instagram'
                            }));
                        
                        
                        
                    return markers.addLayer(ptMarker);


        }
            });
            
            markers.addTo(map);
        }
  });

}
