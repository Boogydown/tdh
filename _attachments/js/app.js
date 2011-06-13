$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "byType";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;
    
/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var AppController = Backbone.Controller.extend({
        initialize : function(){
			// kick off the initial fetch
            Events.fetch();

			// init the Popup handler to attach to the existing pics
			window.utils.popupInit( this );
        }
    });

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	// create our collection of event models
	Events = new window.vu.collections.EventCollection();
	Bands = new window.vu.collections.BandCollection();
	Halls = new window.vu.collections.HallCollection();
	
	// create our main list and map views and attach the collection to them
	var mainListView = new window.vu.bbViews.EventListView({collection:Events});
	var mainMapView = new window.vu.bbViews.MapView({collection:Halls, notifier:Events});
	
	// when this inits, it should call Events.fetch(), which should in theory fetch all
	//	of its data; each model is updated and then triggers a change event which is bound to 
	//	the EventView.render call.  
	// When all data is replaced in the collection, the refresh event is triggered which 
	//	then kicks off the collection's render.
	// FIXME: this implies, then, that each Model is rendered twice...!?
	var App = new AppController();

});
/////////////////////////////////////////////////////////////////////////////}

