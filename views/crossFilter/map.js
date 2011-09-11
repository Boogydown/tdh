function(doc) {
  if ( doc.type && (doc.date || doc.gpsCoordinates) ) {
	var gcary = doc.gpsCoordinates.split(" ");
	emit( [
		doc.type, 
		doc.date ? new Date(doc.date).getTime().toString() : null, 
		parseFloat(gcary[0]), 
		parseFloat(gcary[1])
	 ], doc );
  }
};