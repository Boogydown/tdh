(function () {
	var VU = window.VU = {};
	
	VU.init = function () {
		for ( var method in VU )
			if ( method != "init" )
			{
				try { VU[method].call( window );}
				catch (e) {}
			}
	}
}).call(window);