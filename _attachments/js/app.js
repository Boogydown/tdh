$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "byType";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;
	
	// inits all in the VU namespace, specifically Backbone-View attachments to the HTML
	VU.init();
    
/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var AppController = Backbone.Controller.extend({
        initialize : function(){
			// kick off the initial fetch
            events.fetch( {schema:VU.event_schema_listing});

			// init the Popup handler to attach to the existing pics
			window.utils.popupInit( this );
        }
    });

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	// create our collection of event models
	var colls = {
		bands : new VU.BandCollection(),
		halls : new VU.HallCollection(),
	};
	colls.events = new VU.EventCollection( null, {schema:VU.event_schema_listing, colls:colls});
	
	// create our main list and map views and attach the collection to them
	var mainListView = new VU.EventListView({collection:colls.events});
	var mainMapView = new VU.MapView({collection:colls.halls, notifier:colls.events});
	
	// when this inits, it should call Events.fetch(), which should in theory fetch all
	//	of its data; each model is updated, NOT triggering its own change event
	// When all data is replaced in the collection, the refresh event is triggered which 
	//	then kicks off the collection's render.
	//var App = new AppController();
	// kick off the initial fetch
	colls.events.fetch( {add:true} );

	// init the Popup handler to attach to the existing pics
	window.utils.popupInit( this );

});
/////////////////////////////////////////////////////////////////////////////}

