(function () {
/////////////////////////////////////////////////////////////////////////////}
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
// Now let's define a new Collection of Events
var EventCollection = Backbone.Collection.extend({
	// The couchdb-connector is capable of mapping the url scheme
	// proposed by the authors of Backbone to documents in your database,
	// so that you don't have to change existing apps when you switch the sync-strategy
	url : "event",
	model : EventModel,
	// The events should be ordered by date
	comparator : function(event){
		return new Date( event.get("date") ).getTime();
	}
});

var BandCollection = Backbone.Collection.extend({
	url : "band",
	model : BandModel,
	comparator : function(band){
		return band.get("bandName");
	}
});	

var HallCollection = Backbone.Collection.extend({
	url : "dancehall",
	model : VenueModel,
	comparator : function(hall){
		return hall.get("danceHallName");
	}
});
}).call(this);