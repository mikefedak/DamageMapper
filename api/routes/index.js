var express = require('express')
,router = express.Router()
,pg = require('pg');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/points', function(req, res, next){

    console.info('request',req,res);
    getPoints(req.body, res);
});

function getPoints(bounds,res){


   var connString = "postgres://postgres:stormy-erika-rage@localhost:5432/mapping";
      


pg.connect(connString, function(err, client, done) {
 var handleError = function(err) {
      // no error occurred, continue with the request
      if(!err) return false;

      // An error occurred, remove the client from the connection pool.
      // A truthy value passed to done will remove the connection from the pool
      // instead of simply returning it to be reused.
      // In this case, if we have successfully received a client (truthy)
      // then it will be removed from the pool.
      if(client){
        done(client);
      }
      res.writeHead(500, {'content-type': 'text/plain'});
      res.end('An error occurred');
      return true;
    };
      
    // handle an error from the connection
    if(handleError(err)) return;

//	var sql = 'SELECT row_to_json(fc)',
  //      sql = sql+' FROM ( SELECT "FeatureCollection" As type, array_to_json(array_agg(f)) As features',
    //    sql = sql + ' FROM (SELECT "Feature" As type',
      //  sql = sql + ',ST_AsGeoJSON(pt.geom)::json As geometry',
     //   sql = sql +  ',row_to_json((SELECT l FROM (SELECT IMAGE_URL, DESCRIPTION) As l )) As properties',
  // sql = sql+ 'FROM Point_Table As pt   ) As f )  As fc;'



        var sql = 'select ST_AsGeoJSON(geom) as shape ';
        sql = sql + 'from "Point_Table" ';
//        sql = sql + 'where geom && ST_GeomFromText(\'SRID=3857;POLYGON(($1 $2,$3 $4,$5 $6,$7 $8,$9 $10))\') ';
 //       sql = sql + 'and ST_Intersects(geom, ST_GeomFromText(\'SRID=4326;POLYGON(($11 $12,$13 $14,$15 $16,$17 $18,$19 $20))\'));';
        
        var vals = [bounds._southWest.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._northEast.lat, bounds._southWest.lng, bounds._northEast.lat, bounds._southWest.lng, bounds._southWest.lat];
        var vals = vals.concat(vals);
        


        client.query(sql, function(err, result) {
	
	    done();


	    if(err){
	       res.send(err);
	       return; 
	    }

            var featureCollection = new FeatureCollection();
            for (i = 0; i < result.rows.length; i++)
            {
                featureCollection.features[i] = JSON.parse(result.rows[i].shape);
            }

            res.send(featureCollection);
          //res.send(result); 
        });
        
       
   });

    
}

// GeoJSON Feature Collection
function FeatureCollection(){
    this.type = 'FeatureCollection';
    this.features = new Array();
}








module.exports = router;
