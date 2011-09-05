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

	
	var TDHSessionModel = VU.AuthSessionModel.extend({
		defaults : {
			danceCard: new EventsCollection();
		},
		
		addToCard : function( eventModel ) {
			this.get( "danceCard" ).add( eventModel );
		}
		
	});
		
	
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
				this.mainListView = new VU.ListView({collection:this.colls.events, el: "#dancesList"});
				this.mainMapView = new VU.MapView({collection:this.colls.halls, el: "#dancesMap"});
				
				// kick off the initial fetch
				this.colls.events.fetch();
			},
		}),

		BandsView : VU.ParentView.extend({
			el : $("#bandsDiv"),
			tabEl : $("#bandsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				
				// create our main list and map views and attach the collection to them
				this.mainListView = new VU.ListView({collection:this.colls.bands, el: "#bandsList"});
				
				// kick off the initial fetch
				this.colls.bands.fetch(); //TODO: put a limit in this fetch; will need to load in chunks as you scroll
			}
		}),
		
		HallsView : VU.ParentView.extend({
			el : $("#hallsDiv"),
			tabEl : $("#hallsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				
				// create our main list and map views and attach the collection to them
				this.mainListView = new VU.ListView({collection: this.colls.halls, el: "#hallsList"});
				this.mainMapView = new VU.MapView({collection: this.colls.halls, el: "#hallsMap"});
				
				// kick off the initial fetch
				this.colls.halls.fetch(); //TODO: limit this by #?  map?  alpha?
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
		persistedRoutes : {
			tab : "Dances",
			dates : new Date().getNumber(),
			coords : "",
			popID : ""
		},
		
		instanciatedViews : {},
		
		routes : { 
			":tab": "mainRouter",
			":tab/:dates": "mainRouter",
			":tab/:dates/:coords": "mainRouter",
			":tab/:dates/:coords/:popID": "mainRouter",
		},
	
		// Initialize happens at page load; think RESTful: every time this is called we're starting from scratch
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
			
			//TODO: authenticate session
			var authID = window.utils.readCookie( "tdh_authID", ";" );
			var authModel;
			if ( ! authID ) {}
				// if no cookie then get user login
			else {
				// if cookie then create session model and retrieve it from the db
				authModel = new TDHSessionModel( {"id":authID} );
				authModel.fetch( authSessionLoaded );
			}
			// check cookies for existing Auth id (can only have one at a time)
			// if exists then get if from the db; failure sends to login screen
			// if success then use it
        },
		
		authSessionLoaded : function( authModel ) {
			if ( authModel.fetched ) {
				// yay!
			} else {
				// show login screen
			}
		},
		
		loginSubmit : function () {
			// take u and pw
			// create session model
			// fetch from server
			// store as cookie
		},
		
		mainRouter : function( tab, dates, coods, popID ) {
			tab = tab || this.persistedRoutes.tab;
			popID = popID || this.persistedRoutes.popID;
			coords = coords || this.persistedRoutes.coords;
			dates = dates || this.persistedRoutes.dates;
			var viewClass = ParentViews[ tab + "View" ] || ParentViews[ (tab = this.persistedRoutes.tab) + "View" ];
			var myView = this.instanciatedViews[ tab ] || new viewClass( {colls:this.colls} );
			if ( this.currentView && this.currentView != myView )
				this.currentView.deactivate();
			
			this.persistentRoutes.tab = tab;
			this.persistentRoutes.dates = dates;
			this.persistentRoutes.coords = coords;
			this.persistentRoutes.popID = popID;
			this.saveLocation ( tab + "/" + dates + "/" + coords + "/" + popID );
			
			myView.activate();
			this.instanciatedViews[ tab ] = this.currentView = myView;
			
			if ( popID ) {
				var pAry = popID.split(':');
				var popType = pAry[0];
				popID = pAry[1];
				var template = "popupTemplate_" + popType;
				var docModel = this.colls[popType + "s"] && this.colls[popType + "s"].get( popID );
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

