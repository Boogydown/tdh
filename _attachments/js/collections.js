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
		_.bindAll( this, "applyFilter", "loadMore", "modelAdded", "parseFilter" );
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
		}
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
		this.lastEmpty = this.collection.length == 0;
	},
	
	parseFilter : function ( filterObj ) {
		var filterStr = "";
		// add type to the beginning
		filterObj.startkey.unshift( this.url );
		filterObj.endkey.unshift( this.url );
		filterStr = "startkey=[" + filterObj.startkey.join(",") + "]";
		filterStr += "&endkey=[" + filterObj.endkey.join(",") + "]";
		return filterStr;
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
		if ( options ) {
			this.schema = options.schema;
			this.colls = options.colls;
		}
	}
});

VU.DCardCollection = VU.EventCollection.extend({
	initialize : function ( models, options ) {
		VU.EventCollection.prototype.initialize.call(this, models, options);
		_.bindAll( this, "toggleDCard");
		var globalEvents = options.events;
		if ( globalEvents )
			globalEvents.bind("change:onDCard", this.toggleDCard );
	},

	//called AFTER the change happens...
	toggleDCard : function ( eventModel ) {
		if ( eventModel.get("onDCard") )
			this.add( eventModel );
		else
			this.remove( eventModel );
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