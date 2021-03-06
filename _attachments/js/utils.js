_.mixin({
	splice:function(ary,start,end){
		if ( ary.splice !== undefined )
			return art.splice( start, end );
		else
			return _(ary).chain().rest(start).first(end - start + 1).value();
	}
});

/**
 * Some handy utilities
 */
window.utils = {

	/**
	 * Useful get-var parser by Josh Fraser
	 */
	$_GET : function (q,s) {
		s = (s) ? s : window.location.search;
		var re = new RegExp('&'+q+'=([^&]*)','i');
		return (s=s.replace(/^\?/,'&').match(re)) ? s=s[1] : s='';
	},
	
	/**
	 * Read browser cookie 
	 * @param (string) name - key of cookie
	 * @param (string) delimit - delimiter for multiple values within cookie
	 */
	readCookie : function (name,delimit){
	  if (document.cookie == ''){
		return false;
	  }
	  else {
		var fC,lC;
		var mcookie = unescape(document.cookie);
		fC = mcookie.indexOf(name);
		var ph = fC + name.length;
		if ((fC != -1) && (mcookie.charAt(ph) == '=')){
		  fC += name.length + 1;
		  lC = mcookie.indexOf(delimit,fC);
		  if (lC == -1) lC = mcookie.length;
		  return unescape(mcookie.substring(fC,lC));
		}
		else{
		  return false;
		}
	  }
	},
	
	elipsesStr : function ( str, length ) {
		return (str && str.length && (str.length + 3 > length) && str.substr(0, length) + "..." ) || str;
	},
	
	formatURL : function( url ) {
		if (!url) return ""; 
		return url.replace( /((http:\/\/)?(www\.)?([\w\d-]*?\.)(\w{2,4})\/?)/, "http://www.$4$5" );
	},
	
	parseGPS : function ( gpsString ) {
		var gps = { lat:0, lng:0 };
		if ( gpsString) {
			gpsString = gpsString.replace(/(^\s*)|(\s*$)/g, "");
			var gAry = gpsString.split(",");
			if ( gAry.length < 2 ) 
				gAry = gpsString.split(" ");
			if ( gAry.length > 1 ) {
				gAry = [parseFloat(gAry[0]), parseFloat(gAry[1])];
				//HACK: in Texas, Longitude is negative, so we'll double-check to make sure we have lat/long in order
				if ( gAry[1] > gAry[0] ) {
					gps.lat = gAry[1];
					gps.lng = gAry[0];
				} else {
					gps.lat = gAry[0];
					gps.lng = gAry[1];
				}				
			}
		}
		return gps;
	},
	
	/**
	 * Static class for managing some waiting UI (i.e. loading spinner, progress bar, etc)
	 * A stub for expanding in the future
	 */
	waitingUI : {
		el : {},
		
		init : function ( el ) {
			this.el = $(el);
		},
		
		show : function () {
			this.el.show();
		},
		
		hide : function () {
			this.el.hide();
		}	
	},
	
	/**
	 * flier is optional
	 */
	flyAway : function( src, dest, flier ) {
		flier = flier ? flier.clone() : src.clone();
		var srcOff = src.offset(),
			destOff = dest.offset();
		flier.attr("style", "position:absolute;z-index:999;left:" + srcOff.left + "px;top:" + srcOff.top + 'px;');
		flier.appendTo("body");
		flier.animate( {
			opacity: 0.25,
			left: destOff.left,
			top: destOff.top
		}, null, null, function () { $(this).remove(); } );
	},
	
	/**
	 * REALLY basic logger... just pipes to console if it exists
	 */
	logger : {
		log : function(msg) {
			if ( window.console !== undefined ) 
				console.log(msg);
		},
		
		errorHandler : function( e ) {
			var errMsg = "Error: " + e.message;
			alert( errMsg );
			utils.logger.log( errMsg );
		}
	},

	bulkLoad : function( fileList, callback ) {
		if ( fileList.length )
			$.getScript( fileList.pop(), function() {
				utils.bulkload( fileList, callback );
			});
		else
			callback();
	}
};