// Useful get-var parser by Josh Fraser

window.utils = {
	mainContext : null,
	
	$_GET : function (q,s) {
		s = (s) ? s : window.location.search;
		var re = new RegExp('&'+q+'=([^&]*)','i');
		return (s=s.replace(/^\?/,'&').match(re)) ? s=s[1] : s='';
	},
	
};