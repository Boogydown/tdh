function(doc) {
  if ( doc.type || doc.date || doc.gpsCoordinates || doc.stylesPlayed ) {
	var gcary = doc.gpsCoordinates.split(" ");
	emit( [
		doc.type, 
		doc.date ? new Date(doc.date).getTime() : "a", 
		parseFloat(gcary[0]), 
		parseFloat(gcary[1])
	 ], doc );
  }
};