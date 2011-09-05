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
	}
};