VU.InitColls = function () {
/////////////////////////////////////////////////////////////////////////////}
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
VU.FilteredCollection = Backbone.Collection.extend({
	// max num of models to pull each time
	queryLimit: 20,
	
	// was the last fetch empty?  if so, don't try again...
	lastEmpty: false,
	
	// the last filter that we used
	lastFilterStr: "",
	
	// query used in fetch
	query: "",
	
	initialize : function () {
		_.bindAll( this, "applyFilter", "loadMore", "modelAdded", "parseFilter", "getFromServer" );
	},
	
	applyFilter : function ( newFilter, options ) {
		options = options || {};
		var newFilterStr = this.parseFilter( newFilter );
		if ( newFilterStr != this.lastFilterStr ) {
			
			//reload
			this.query = "?limit=" + this.queryLimit + 
						 "&" + newFilterStr;
			this.lastFilterStr = newFilterStr;
			this.bind( "refresh", this.modelAdded );
			this.lastEmpty = true; 	// true until proven false
			this.fetch( options );
			return true;
		}
		return false;
	},
	
	loadMore : function() {
		if ( ! this.lastEmpty ){
			//load next page (add-only fetch)
			this.query = "?limit=" + this.queryLimit + 
						 "&startkey_docid=" + this.last.id + 
						 "&" + newFilterStr;
			this.bind( "add", this.modelAdded );
			this.lastEmpty = true; 	// true until proven false
			options.add = true;
			this.fetch( options );				
		}
	},
	
	modelAdded : function () {
		this.unbind( "add", this.modelAdded );
		this.unbind( "refresh", this.modelAdded );
		// since refresh triggers regardless of whether something was added, we shuold check the coll length
		this.lastEmpty = this.length == 0;
	},
	
	parseFilter : function ( filterObj ) {
		var filterStr = "";
		// add type to the beginning
		filterObj.startkey.unshift( this.url );
		filterObj.endkey.unshift( this.url );
		filterStr = JSON.stringify( filterObj ).replace(',"endkey":','&endkey=').replace('{"startkey":','startkey=');
		filterStr = filterStr.substr( 0,filterStr.length - 1 );
		return filterStr;
	},
	
	getFromServer : function( id, options ) {
		var model = this.get(id);
		if ( !model ) {
			model = new this.model( {id:id} );
			model.fetch(options);
		}
		return model;
	}
});

// Now let's define a new Collection of Events
VU.EventCollection = VU.FilteredCollection.extend({
	url : "event",
	model : VU.EventModel,
	
	// The events should be ordered by date
	comparator : function(event){
		return new Date( event.get("date") ).getTime();
	},
	
	initialize : function ( models, options ) {
		VU.FilteredCollection.prototype.initialize.call(this, models, options);
		_.bindAll( this, "fetchAndSet", "_setAfterFetch" );
		if ( options ) {
			this.schema = options.schema;
			this.colls = options.colls;
		}
	},
	
	fetchAndSet : function( idAry, attr ) {
		//HACK: Once cached Colls and View colls get separated, remove this...
		this._fetchSet = {attrKeys:idAry, attr:attr};
		if ( TDH_tab != "DanceCard" ) {
			var oldQ = this.query;
			this.query = "?startkey=[\"event\"," + new Date().getTime() + "]&endkey=[\"event\",[]]";
			this.fetch( {success:this._setAfterFetch} );
			this.query = oldQ;
		} else
			this.bind( "refresh", this._setAfterFetch );
	},
	
	_setAfterFetch : function(  ){
		this.unbind( "refresh", this._setAfterFetch );
		var fetchSet = this._fetchSet,
			coll = this;
		_.each( fetchSet.attrKeys, function(modelID) { 
			var model = coll.get(modelID);  
			if (model) model.set(fetchSet.attr);
		});
	}
});

VU.DCardCollection = VU.EventCollection.extend({
	prevColl : null,
	
	initialize : function ( models, options ) {
		VU.EventCollection.prototype.initialize.call(this, models, options);
		_.bindAll( this, "toggleDCard");
		var globalEvents = options.events;
		if ( globalEvents )
			globalEvents.bind("change:onDCard", this.toggleDCard );
	},

	//called AFTER the change happens...
	toggleDCard : function ( eventModel ) {
		if ( eventModel.get("onDCard") ) {
			this.prevColl = eventModel.collection;
			this.add( eventModel );
		} else {
			this.remove( eventModel );
			eventModel.collection = this.prevColl;
		}			
	}
});

VU.BandCollection = VU.FilteredCollection.extend({
	url : "band",
	model : VU.BandModel,
	comparator : function(band){
		return band.get("bandName");
	}
});	

VU.HallCollection = VU.FilteredCollection.extend({
	url : "dancehall",
	model : VU.VenueModel,
	comparator : function(hall){
		return hall.get("danceHallName");
	}
});
};