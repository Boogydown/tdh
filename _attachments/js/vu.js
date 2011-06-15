(function () {
	var VU = window.VU = {};
	
	VU.init = function () {
		for ( var method in VU )
			VU[method].call( window );
	}
}).call(window);