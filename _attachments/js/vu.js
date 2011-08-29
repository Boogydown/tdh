(function () {
	var VU = window.VU = {};
	
	VU.init = function () {
		for ( var method in VU )
		{
			console.log( "method = " + method );
			if ( method instanceof Function && method != "init" )
			{
				VU[method].call( window );
				console.log( "call: " + method );
			}
		}
	}
}).call(window);