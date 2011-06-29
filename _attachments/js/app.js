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
		routes : { 
			"pop/:type/:docID": "showPopup"
			//TODO: default route should hide popup?
		},
		
        initialize : function(){
			_.bindAll( this, "showPopup" );
			this.bind( "route:showPopup", this.showPopup );

			this.colls = {
				bands : new VU.BandCollection(),
				halls : new VU.HallCollection(),
			};
			this.colls.events = new VU.EventCollection( null, {
				schema: VU.schemas_events_listing, 
				colls: this.colls
			});

			// create our main list and map views and attach the collection to them
			this.mainListView = new VU.EventListView({collection:this.colls.events});
			this.mainMapView = new VU.MapView({collection:this.colls.halls, notifier:this.colls.events});
			
			// init the popup view
			this.popupView = new VU.PopupView( );
			
			// kick off the initial fetch
            this.colls.events.fetch();
        },
		
		showPopup : function( type, docID ) {
			var template = "popupTemplate_" + type;
			var docModel = this.colls[type + "s"] && this.colls[type + "s"].get( docID );
			if ( docModel ){
				docModel.loadEvents( this.colls.events );
				this.popupView.openPopup( docModel, template );
			} 
			else {
				//alert("No such document " + docID + " in collection " + type + "s.");
				// remove route; keep the hash to prevent reloading
				window.location = window.location.href.split("#")[0] + "#";
			}
		}
    });

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	// When this inits it should call Events.fetch(), which should in theory fetch all
	//	of its data; each model is updated, NOT triggering its own change event
	// When all data is replaced in the collection, the refresh event is triggered which 
	//	then kicks off the collection's render.
	
	window.app = new AppController();
	Backbone.history.start();

});
/////////////////////////////////////////////////////////////////////////////}

