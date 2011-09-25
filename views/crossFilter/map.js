function(doc) {
  if ( doc.type ) {
	// since "a" comes after any number we use it include all values if it doesn't exist
	var gcary = doc.gpsCoordinates ? doc.gpsCoordinates.split(" ") : ["a","a"];
	emit( [
		doc.type, 
		doc.date ? new Date(doc.date).getTime() : "a", 
		parseFloat(gcary[0]), 
		parseFloat(gcary[1])
	 ], doc );
  }
};