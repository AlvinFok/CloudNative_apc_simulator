const MongoClient = require('mongodb').MongoClient;
const { initValue } = require('config');

MongoClient.connect("mongodb://localhost:27017/apc_simulator", function (err, db) {
  if(err) throw err;
  console.log('MongoDB successfully connected!');
  db.collection("factor_parameters",function(err,collection){
  	if(err) throw err;
  	for (const [key, value] of Object.entries(initValue)) {
		  console.log(`init default value: ${key}=${value}`);
		  // reset or insert init value
	  	collection.updateOne(
	  		{ 'name': key },
	  		{ $set: { name: key, value: value } },
	  		{ upsert: true },
	  	);
		}
  });
});

module.exports = {
  db: MongoClient,
};