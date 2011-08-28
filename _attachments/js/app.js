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
/// PARENT VIEWS ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	var ParentViews = {
		
		DancesView : VU.ParentView.extend({
			el : $("#dancesDiv"),
			tabEl : $("#dancesTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				
				// create our main list and map views and attach the collection to them
				this.mainListView = new VU.EventListView({collection:this.colls.events});
				this.mainMapView = new VU.MapView({collection:this.colls.halls, mapNode: "dancesMap"});
				
				// kick off the initial fetch
				this.colls.events.fetch();
			},
		}),

		BandsView : VU.ParentView.extend({
			el : $("#bandsDiv"),
			tabEl : $("#bandsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				/*
				// create our main list and map views and attach the collection to them
				this.mainListView = new VU.ListView({collection:this.colls.bands});
				
				// kick off the initial fetch
				this.colls.events.fetch();
				*/
			}
		}),
		
		HallsView : VU.ParentView.extend({
			el : $("#hallsDiv"),
			tabEl : $("#hallsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				/*
				// create our main list and map views and attach the collection to them
				this.mainListView = new VU.ListView({collection:this.colls.halls});
				this.mainMapView = new VU.MapView({collection:this.colls.halls, mapNode: "hallsMap"});
				
				// kick off the initial fetch
				this.colls.events.fetch();
				*/
			}
		}),
		
		DanceCardView : VU.ParentView.extend({
			el : $("#danceCardDiv"),
			tabEl : $("#dCardTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				/*
				// create our main list and map views and attach the collection to them
				this.mainListView = new VU.ListView({collection:this.colls.halls});
				this.mainMapView = new VU.MapView({collection:this.colls.halls, mapNode: "hallsMap"});
				
				// kick off the initial fetch
				this.colls.events.fetch();
				*/
			}
		})
	};
    
/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var AppController = Backbone.Controller.extend({
		currentTab : "Dances",
		instanciatedViews : {},
		
		routes : { 
			":tab": "mainRouter",
			":tab/:popType/:docID": "mainRouter",
		},
		
        initialize : function(){
			_.bindAll( this, "mainRouter" );
			this.bind( "route:mainRouter", this.mainRouter );

			this.colls = {
				bands : new VU.BandCollection(),
				halls : new VU.HallCollection(),
			};
			this.colls.events = new VU.EventCollection( null, {
				schema: VU.schemas.events.listing, 
				colls: this.colls
			});

			// init the popup view
			this.popupView = new VU.PopupView( );
        },
		
		mainRouter : function( tab, popType, docID ) {
			tab = tab || this.currentTab;
			var viewClass = ParentViews[ tab + "View" ] || ParentViews[ (tab = this.currentTab) + "View" ];
			var myView = this.instanciatedViews[ tab ] || new viewClass( {colls:this.colls} );
			if ( this.currentView && this.currentView != myView )
				this.currentView.deactivate();
			
			this.saveLocation ( tab + "/" + popType + "/" + docID );
			myView.activate();
			this.instanciatedViews[ this.currentTab = tab ] = this.currentView = myView;
			
			if ( popType ) {
				var template = "popupTemplate_" + popType;
				var docModel = this.colls[popType + "s"] && this.colls[popType + "s"].get( docID );
				if ( docModel ){
					docModel.loadEvents( this.colls.events );
					this.popupView.openPopup( docModel, template );
				} 
				else {
					window.location = "#" + tab;
				}
			} else {
				// TODO: hide popup
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

