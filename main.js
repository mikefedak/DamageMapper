
//Initiate the map with leaflet-editable hooks 
var map = L.map('map');

var editing = false,
imgLink="http://localhost/api/uploads/notfound.jpg", //This should be based on a siteurl from the configs
siteUrl="http://localhost",
markers = new L.layerGroup(),
fullImg = null,
thumbnail =null,
selectedCoords = null,
width = $(window).width();


//Check the window size and change elements accordingly
$(document).ready(function () {

  if (width <= 800) {
    $('#entrymodal').addClass('bottom-sheet');
    
    /*
    --- Need to add:
    1. Fix for modal closing on small displays the overlay is not being removed
    2. Sizing for popups, should be based on the size of the display and not a fixed size as currently on small screens
    3. Look into possible retina display issues 
    4. Drop the marker on click for small displays? No dragging     
    6. Optional - Search bar edits, may be able to use media queries for this. S    
    */

  }


});

//Get the points from the api
map.on('load', function (e) {
    requestPoints(); //consider using a .then() callback here 
    //Should add these to a marker cluster group
    
    //open modal on load
    $('#infoModal').openModal();
});


map.setView([15.4, -61.3], 11);

var tilelayer = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { maxZoom: 20, attribution: 'Data \u00a9 <a href="http://www.openstreetmap.org/copyright"> OpenStreetMap Contributors </a> Tiles \u00a9 HOT' }).addTo(map)


/*
    ###### TOOLS #######
*/
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

             // var editMark = map.editTools.startMarker();
             
             //change cursor
             $('#map').addClass('pointer-cursor');
             
             map.on('click', function(event){
                 enterDetails(event);
             });
             
             //add click listener to map
        
              editing = true;
        
              $(document).keyup(function (e) {
                if (e.keyCode == 27) { // escape key maps to keycode `27`
                    editing = false;
                    //map.editTools.stopDrawing();
                    $('#map').removeClass('pointer-cursor');
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



function enterDetails(e) {

  selectedCoords = 'POINT('+e.latlng.lng+' '+e.latlng.lat+')';
  $('#entrymodal').openModal({
      dismissible: true, // Modal can be dismissed by clicking outside of the modal
      ready: function() { }, // Callback for Modal open
      complete: function() {    //Callback for modal close, !!!not being called on cancel
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

              url: siteUrl + ':3000/uploads'
              , method: 'post'
              , data: requestData
              , error: function (err) {
                  $('#messages').empty();
                  $("#messages").append('Error: ' + err[0]); //show the first index
              }
              , success: function (resp) {                  
                  resetMap();                  
              }
          });

          };
          img.crossOrigin = 'anonymous';
          img.src = imgURL;
    } else {

        var ckVal = [];
        $('#checkboxes input:checked').each(function () {
            ckVal.push(this.value);
        });

        var requestData = {
            'image_link': $('#imageLink').val(),
            'attribution': $('#attr').val(),
            'description': $('#desc').val(),
            'eventType': ckVal.toString(),
            'thumbnail': thumbnail,
            'full_image': fullImg,
            'geom': selectedCoords
        };
        
        reqwest({

            url: siteUrl + ':3000/uploads'
            , method: 'post'
            , data: requestData
            , error: function (err) {
                $('#messages').empty(); $("#messages").append('Error: ' + err);
            }
            , success: function (resp) {

               resetMap();
            }
        });
    }  
    

   
});



//Clears the map settings post modal close
function resetMap(){
    $('#entrymodal').closeModal();
    markers.clearLayers();
    requestPoints();
                  
    //There is a bug in materialize which does not remove the display modal 
    //So we select by class and remove that element
    var leanOverlay = $(".lean-overlay");
    leanOverlay.remove()
                  
    //Reset the form                  
    $('#data')[0].reset();
    $('#messages').empty();
    $('#takePictureField').val("");
                  
    //Remove the click listener from the map
    map.off('click');
                  
    //Reset the cursor
    $('#map').removeClass('pointer-cursor');
}

//Disable the image upload if an image link is entered
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

// CONSTRUCTORS AND UTILITY FUNCTIONS

//Constructor for the add event control 
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

// Image processing function 
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
    } else {
        // !!! NEED TO RETURN ERROR IF THE USER HAS NOT ENTERED AN IMAGE
    }
}


// Image resizing before sending to the api
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
                    var mobileTemplate= '<a href="{link}" title="View Larger Image"><img style="width:100%" src="{image_standard}"/></a><p>Description: {caption}</a></p><p>Source: {attr}</p><p>Events: {event}</p>'
                    var utilTemplate=  { link: feature.properties.SOURCE_URL, 
                         caption: feature.properties.DESCRIPTION, image_standard: feature.properties.IMAGE_URL,event: feature.properties.EVENT, attr: feature.properties.ATTRIBUTION}   
                     
                      if (width <= 800) {
                          
                                                    
                          //On a small display add a click listener
                          ptMarker.on('click', function(){
                              
                              $('#infoTemplateContent').html(L.Util.template(mobileTemplate,utilTemplate ,  
                         {
                           className: 'leaflet-popup-instagram'
                         }));
                              $('#detailsModal').openModal();                              
                          })
                          
                      } else{ 
                           // If the display can fit the entire image         
                         ptMarker.bindPopup(L.Util.template(imageTemplate,utilTemplate,  
                         {
                           className: 'leaflet-popup-instagram'
                         }));
                      }
                   
                        
                        
                       
                    return markers.addLayer(ptMarker);


        }
            });
            //consider replacing this with a marker cluster group
            markers.addTo(map);
        }
  });

}
