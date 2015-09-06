var express = require('express')
  , router = express.Router()
  , pg = require('pg')
  , q = require('q'),
  config = require('../config');
  

//Move these into a config file and add the config file to gitignore
var connString = config.connString;
var uploadUrl = config.uploadUrl;


router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/points', function (req, res, next) {
  getPoints(req.body, res);
});

router.post('/uploads', function (req, res, next) {
  //console.info('uploads endpoint hit', req.body);
  var curDate=Date.now();  

  writeFile(req.body.thumbnail,"thumb", curDate)
  .then(function(result){
    req.body.thumb=uploadUrl+'/'+curDate+'_thumb.jpg';
    
  })
  .fail(function(err){
    res.status(500).send('Image Upload Failed');
    res.end();
  });
  
  writeFile(req.body.full_image,"full", curDate)
   .then(function(result){
      req.body.image=uploadUrl+'/'+curDate+'_full.jpg';
      formtoDB(req.body, res);
  })
  .fail(function(err){
    res.status(500).send('Image Upload Failed');
    res.end();
  });

  
});

function writeFile(data,filetype,currentdate){

  var base64Data = data.replace(/^data:image\/jpeg;base64,/, "");
  var deferred = q.defer();
  var fileName = "./uploads/"+currentdate+"_"+filetype+".jpg";
  
  require("fs").writeFile(fileName, base64Data, 'base64', function(err) {
    if(err){
        deferred.reject(err);    
    } else{
      deferred.resolve(fileName);
    }

  });
  return deferred.promise;
}

function formtoDB(data,res){

  pg.connect(connString, function (err, client, done) {
      var handleError = function (err) {
      // no error occurred, continue with the request
      if (!err) return false;

      
      if (client) {
        done(client);
      }
      
      return true;
    };
      
    // handle an error from the connection
    if (handleError(err)) return;  
  

    client.query("INSERT INTO \"Point_Table\"(\"IMAGE_URL\",\"THUMB_URL\",\"SOURCE_URL\",\"DESCRIPTION\",\"ATTRIBUTION\",\"EVENT\",\"geom\") values($1, $2, $3, $4, $5, $6, ST_PointFromText($7, 4326))", 
      [data.image, data.thumb,data.image_link,data.description,data.attribution,data.eventType,data.geom],
      function(err,result){         
        
         done();

        if (err) {
           res.status(500).send('Failed Getting Points')

           return;
        }else{
           res.status(200).send('Row added Successfully');
        }

      });

  });
  

}


function getPoints(bounds, res) {


  pg.connect(connString, function (err, client, done) {
    var handleError = function (err) {
      // no error occurred, continue with the request
      if (!err) return false;

      // An error occurred, remove the client from the connection pool.
      // A truthy value passed to done will remove the connection from the pool
      // instead of simply returning it to be reused.
      // In this case, if we have successfully received a client (truthy)
      // then it will be removed from the pool.
      if (client) {
        done(client);
      }

      return true;
    };
      
    // handle an error from the connection
    if (handleError(err)) return;
    
  //Get points from the server as a geojson feature collection     
    
   var sql="SELECT row_to_json(fc) FROM (SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) \
   AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom)::json As geometry, \
   row_to_json((SELECT l FROM (SELECT \"IMAGE_URL\",\"THUMB_URL\",\"DESCRIPTION\",\"ATTRIBUTION\",\"SOURCE_URL\",\"EVENT\") AS l ))\
    AS properties FROM \"Point_Table\" AS lg ) AS f )  AS fc;"
        
    client.query(sql, function (err, result) {
      
        done();
        
        if (err) {
           res.status(500).send('Failed Getting Points')
           return;
        }
       res.send(result);
    });


  });


}



module.exports = router;
