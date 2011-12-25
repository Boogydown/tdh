function (keys, values, rereduce){
if ( !rereduce){
  var att = [], x, y, len = keys.length;
    for ( x = 0; x < len; x++ ) 
      for ( y in values[x] )
        if ( y != "" )
	  att.push( keys[x] + "/" + y );
return att;
}