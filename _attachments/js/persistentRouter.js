VU.InitPersistentRouter = function () {

VU.PersistentRouter = Backbone.Router.extend({
	persistedRoutes : [],
	defaultParams : [],
	
	initialize : function () {
		// syntax:  routeParams: { tab : "Dances", _tab : { "Dances": {filter1 : "blah", filter2 : ""}}, popID:""}
		// 			routeHandler: handler );
		_.bindAll( this, "routeHandlerWrapper", "saveRoutes" );
		var rp, val, routeStr = "";
		for ( rp in this.routeParams ) {
			this.persistedRoutes.push(val = this.routeParams[rp]);
			this.defaultParams.push(val);
			this.route(routeStr += (":" + rp), "routeHandlerWrapper", this.routeHandlerWrapper );
			routeStr += "/"
		}
	},
	
	routeHandlerWrapper:function (/* arg list */) {
		this._savedLoc = false;
		// retrieve persisted/nested routes
		var i, arg, newArgs = [];
		for ( i in this.persistedRoutes ) {
			arg = (arguments.length > i && arguments[i]) || "";
			if ( ( arg === undefined || arg == "" ) && this.defaultParams[i] != null ) newArgs.push(this.persistedRoutes[i]);
			else if ( arg == "!" ) newArgs.push(this.defaultParams[i]);
			else newArgs.push( arg );
		}
		
		// call user's handler
		try {
		this.routeHandler.apply( this, newArgs );
		} catch(e){alert(e.description);}
		
		// save persistent routes (if not called earlier, by user's handler)
		if ( ! this._savedLoc ) this.saveRoutes.apply( this, newaArgs );
	},
	
	saveRoutes : function (/* arg list */) {
		var i = 0, len = Math.min(arguments.length, this.persistedRoutes.length), url = "";
		for ( ; i < len; i++) url += (this.persistedRoutes[i] = arguments[i]) + "/";
		this.navigate( url = url.substr(0, url.length - 1 ) ); //nix trailing slash
		this._savedLoc = true;
		return url;
	}
});

};