function(doc) {
  if ( doc.type && (doc.date || doc.gpsCoordinates) ) {
	var gcary = doc.gpsCoordinates.split(" ");
	emit( [
		doc.type, 
		new Date(doc.date).getTime().toString(), 
		parseFloat(gcary[0]), 
		parseFloat(gcary[1])
	 ], null );
  }
};