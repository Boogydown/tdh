VU.InitPersistentRouter = function () {

VU.PersistentRouter = Backbone.Controller.extend({
	initialize : function () {
		// syntax:  routeParams: { tab : "Dances", _tab : { "Dances": {filter1 : "blah", filter2 : ""}}, popID:""}
		// 			routeHandler: handler );
		_.bindAll( this, "routeHandlerWrapper", "saveRoutes" );
		var rp, val, routeStr = "";
		for ( rp in this.routeParams ) {
			this.persistedRoutes.push(val = this.routeParams[rp]);
			this.defaultParams.push(val);
			this.route(routeStr += (":" + rp + "/"), "routeHandlerWrapper", this.routeHandlerWrapper );
		}
	},
	
	routeHandlerWrapper:function (/* arg list */) {
		this._savedLoc = false;
		// retrieve persisted/nested routes
		var i, arg;
		for ( i in arguments ) {
			arg = arguments[i];
			if ( !arg ) arg = this.persistedRoutes[i];
			if ( arg == "!" ) arg = this.defaultParams[i];
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