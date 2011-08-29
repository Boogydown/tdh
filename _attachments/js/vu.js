(function () {
	var VU = window.VU = {};
	
	VU.init = function () {
		for ( var method in VU )
			if ( VU[method] instanceof Function && method != "init" )
				VU[method].call( window );
	}
}).call(window);