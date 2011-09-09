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

	//TODO: is this the right callback signature?
	toggleDCard : function ( ev, eventModel, options ) {
		if ( event.get("onDCard") )
			this.add( event );
		else
			this.remove( event );
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