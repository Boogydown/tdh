VU.InitPersistentRouter = function () {

VU.PersistentRouter = Backbone.Controller.extend({
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
		var i, arg;
		for ( i in this.persistedRoutes ) {
			arg = (arguments.length > i && arguments[i]) || "";
			if ( arg === undefined || arg == "" ) arguments[i] = this.persistedRoutes[i];
			if ( arg == "!" ) arguments[i] = this.defaultParams[i];
		}
		
		// call user's handler
		this.routeHandler.apply( this, arguments );
		
		// save persistent routes (if not called earlier, by user's handler)
		if ( ! this._savedLoc ) this.saveRoutes.apply( this, arguments );
	},
	
	saveRoutes : function (/* arg list */) {
		var i, url;
		for ( i in arguments ) url += (this.persistedRoutes[i] = arguments[i]) + "/";
		this.saveLocation( url );
		this._savedLoc = true;
	}
});

};