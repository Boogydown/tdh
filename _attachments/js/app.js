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
		},
		
		initialize : function() {
			_.bindAll( this, "addToCard" );
			this.set( { dCard: new VU.EventCollection() } );
		},
		
		addToCard : function( eventModel ) {
			this.get( "dCard" ).add( eventModel );
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
				//this.calView = new VU.CalView( {el: "#dancesCal"});
				
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
				
			}
		}),
		
		DanceCardView : VU.ParentView.extend({
			el : $("#danceCardDiv"),
			tabEl : $("#dCardTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);

				// create our main list and map views and attach the collection to them
				this.mainListView = new VU.ListView({collection:this.colls.dCard, el: "#dCardList"});
				//this.mainMapView = new VU.MapView({collection:this.colls.halls, mapNode: "hallsMap"});
			}
		})
	};
    
/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var AppController = VU.PersistentRouter.extend({
		routeParams : { 
/*			tab : "Dances",
			_tab : { 
				"Dances" : {
					filter1 : new Date().getTime(),
					filter2 : ""
				},
				"Bands" : {
					filter1 : "A",
					filter2 : ""
				},
				"Halls" : {
					filter1 : "A",
					filter2 : ""
				}
			},
			popID : ""
*/
			tab : "Dances",
			dates : new Date().getTime(),
			coords : "",
			popID : ""			
		},
		
		instanciatedViews : {},

		
		/*
		routes : { 
			":tab": "mainRouter",
			":tab/:dates": "mainRouter",
			":tab/:dates/:coords": "mainRouter",
			":tab/:dates/:coords/:popID": "mainRouter",
		},*/
	
		// Initialize happens at page load; think RESTful: every time this is called we're starting from scratch
        initialize : function(){
			VU.PersistentRouter.prototype.initialize.call(this);
			_.bindAll( this, "routeHandler", "authSessionLoaded" );
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
			var mySession;
			if ( ! authID ) {
				// TODO: if no cookie then keep login button visible and create new, anon session
				mySession = new TDHSessionModel();
				this.authSessionLoaded( mySession );
			} else {
				// if cookie then create session model and retrieve it from the db
				mySession = new TDHSessionModel( {"id":authID} );
				mySession.fetch( {success:this.authSessionLoaded});
			}
			
			// check cookies for existing Auth id (can only have one at a time)
			// if exists then get if from the db; failure sends to login screen
			// if success then use it
        },
		
		authSessionLoaded : function( mySession ) {
			if ( mySession.fetched ) {
				// yay!  remove login link
			} else {
				// from here on it's anon; show login link
			}
			
			// stuff to do for all sessions
			this.colls.dCard = mySession.get( "dCard" );
			var allEvents = this.colls.events;
			window.addToDanceCard = function ( eventID ) {
				alert("You have added this event to your Dance Card!");
				mySession.addToCard( allEvents.get( eventID ) );
			}
		},
		
		loginSubmit : function () {
			// take u and pw
			// create session model
			// fetch from server
			// store as cookie
		},
		
		routeHandler : function( tab, dates, coords, popID ) {
			//tab = tab || (this.persistedRoutes[tab] && this.persistedRoutes[tab].value;
			/*
			if ( ! tab || tab == "!" ) tab = this.persistedRoutes.tab;
			if ( ! popID || popID == "!" ) popID = this.persistedRoutes.popID;
			if ( ! coords || coords == "!" ) coords = this.persistedRoutes.coords;
			if ( ! dates || dates == "!" ) dates = this.persistedRoutes.dates;*/
			var viewClass = ParentViews[ tab + "View" ] || ParentViews[ (tab = this.routeParams.tab) + "View" ];
			var myView = this.instanciatedViews[ tab ] || new viewClass( {colls:this.colls} );
			if ( this.currentView && this.currentView != myView )
				this.currentView.deactivate();
			
			this.saveRoutes( tab, dates, coords, popID );
			
			myView.activate();
			this.instanciatedViews[ tab ] = this.currentView = myView;
			
			if ( popID ) {
				var pAry = popID.split('&');
				var popType = pAry[0];
				popID = pAry[1];
				var template = "popupTemplate_" + popType;
				var docModel = this.colls[popType + "s"] && this.colls[popType + "s"].get( popID );
				if ( docModel ){
					docModel.loadEvents( this.colls.events );
					this.popupView.openPopup( docModel, template );
				} 
				else {
					window.location = "#///!";
				}
			} else {
				// TODO: ensure popup's closed?
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

