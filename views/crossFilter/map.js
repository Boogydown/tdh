function(doc) {
  if ( doc.type ) {
	var gcary = doc.gpsCoordinates ? doc.gpsCoordinates.split(" ") : [0,0];
	emit( [
		doc.type, 
		doc.date ? new Date(doc.date).getTime() : 0,
		parseFloat(gcary[0]), 
		parseFloat(gcary[1])
	 ], doc );
  }
};