VU.InitColls = function () {
/////////////////////////////////////////////////////////////////////////////}
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
// Now let's define a new Collection of Events
VU.EventCollection = Backbone.Collection.extend({
	// The couchdb-connector is capable of mapping the url scheme
	// proposed by the authors of Backbone to documents in your database,
	// so that you don't have to change existing apps when you switch the sync-strategy
	url : "event",
	model : VU.EventModel,
	
	// The events should be ordered by date
	comparator : function(event){
		return new Date( event.get("date") ).getTime();
	},
	
	initialize : function ( models, options ) {
		_.bindAll( this, "continueLoad" );
		this.schema = options.schema;
		this.colls = options.colls;
	},
	
	gradualLoad : function () {
		this.bind( "refresh", this.continueLoad );
		// do this first to load data, and keep it ordered
		this.fetch();
	},
	
	continueLoad : function () {
		this.each( function ( model ) { 
			// trigger normalizations
			model.trigger("change");
			// trigger View additions
			model.collection.trigger("add");
		});
	}
});

VU.BandCollection = Backbone.Collection.extend({
	url : "band",
	model : VU.BandModel,
	comparator : function(band){
		return band.get("bandName");
	}
});	

VU.HallCollection = Backbone.Collection.extend({
	url : "dancehall",
	model : VU.VenueModel,
	comparator : function(hall){
		return hall.get("danceHallName");
	}
});
};