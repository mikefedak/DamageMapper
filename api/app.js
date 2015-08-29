
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , pg = require('pg');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.set('view options', {
  layout: false
})


// Routes

app.get('/', routes.index);

app.post('/points', function(req,res){
    console.info('points called', req,res);
    getPoints(req.body, res);
})

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});




function getPoints(bounds,res){
   var connString = "pg://postgres:steak@localhost:5432/geonode";
   pg.connect(connString, function(err, client) {

      
        var sql = 'select ST_AsGeoJSON(geog) as shape ';
        sql = sql + 'from Point_Table';
        sql = sql + 'where geog && ST_GeogFromText(\'SRID=4326;POLYGON(($1 $2,$3 $4,$5 $6,$7 $8,$9 $10))\') ';
        sql = sql + 'and ST_Intersects(geog, ST_GeogFromText(\'SRID=4326;POLYGON(($11 $12,$13 $14,$15 $16,$17 $18,$19 $20))\'));';
        
        var vals = [bounds._southWest.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._northEast.lat, bounds._southWest.lng, bounds._northEast.lat, bounds._southWest.lng, bounds._southWest.lat];
        var vals = vals.concat(vals);
        
        client.query(sql, vals, function(err, result) {
            var featureCollection = new FeatureCollection();

            for (i = 0; i < result.rows.length; i++)
            {
                featureCollection.features[i] = JSON.parse(result.rows[i].shape);
            }

            res.send(featureCollection);
          
        });
        
       
   });

    
}

// GeoJSON Feature Collection
function FeatureCollection(){
    this.type = 'FeatureCollection';
    this.features = new Array();
}