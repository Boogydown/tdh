window.utils = {

	// Useful get-var parser by Josh Fraser
	$_GET : function (q,s) {
		s = (s) ? s : window.location.search;
		var re = new RegExp('&'+q+'=([^&]*)','i');
		return (s=s.replace(/^\?/,'&').match(re)) ? s=s[1] : s='';
	},
	
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
	
	/* Static class for managing some waiting UI (i.e. loading spinner, progress bar, etc)
	 * A stub for expanding in the future
	 *
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
	
	// flier is optional
	flyAway : function( src, dest, flier ) {
		flier = flier ? flier.clone() : src.clone();
		var	srcOff = src.offset(),
			destOff = dest.offset();
		flier.attr("style", "position:fixed;z-index:999;left:" + srcOff.left + ";top:" + srcOff.top );
		flier.appendTo("body");
		flier.animate( {
			opacity: 0.25,
			left: destOff.left,
			top: destOff.top
		}, null, null, function () { $(this).remove(); } );
	}
};