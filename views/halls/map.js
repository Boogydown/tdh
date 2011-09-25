function(doc) {
  if ( doc.type && doc.type == "dancehall" ){
      var gcary = doc.gpsCoordinates ? doc.gpsCoordinates.split(" ") : ["a","a"];
      emit( [
          doc.danceHallName,
          parseFloat(gcary[0]),
          parseFloat(gcary[1])
      ]);
  }
};