$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "crossFilter";
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
				this.mainListView = new VU.ListView({collection:this.colls.events, listingClass:VU.EventListingView, el:"#dancesList"});
				this.mainMapView = new VU.MapView({collection:this.colls.halls, el: "#dancesMap"});
				this.calView = new VU.CalView( {el: "#dancesCal"});
			},
			
			activate : function ( filter ) {
				VU.ParentView.prototype.activate.call(this);
				this.mainListView.applyFilter( filter );
			}
		}),

		BandsView : VU.ParentView.extend({
			el : $("#bandsDiv"),
			tabEl : $("#bandsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				this.mainListView = new VU.ListView({collection:this.colls.bands, el: "#bandsList"});
			},
			
			activate : function ( filter ) {
				VU.ParentView.prototype.activate.call(this);
				this.mainListView.applyFilter( filter );
			}			
		}),
		
		HallsView : VU.ParentView.extend({
			el : $("#hallsDiv"),
			tabEl : $("#hallsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				this.mainListView = new VU.ListView({collection: this.colls.halls, el: "#hallsList"});
				this.mainMapView = new VU.MapView({collection: this.colls.halls, el: "#hallsMap"});
			},
			
			activate : function ( filter ) {
				VU.ParentView.prototype.activate.call(this);
				this.mainListView.applyFilter( filter );
			}
		}),
		
		DanceCardView : VU.ParentView.extend({
			el : $("#danceCardDiv"),
			tabEl : $("#dCardTabBtn"),
			initialize : function() {
				_.bindAll( this, "render" );
				VU.ParentView.prototype.initialize.call(this);

				// create our main list and map views and attach the collection to them
				this.mainListView = new VU.ListView({collection:this.colls.dCard, listingClass:VU.EventListingView, el:"#dCardList"});
				this.mainListView.collection.unbind( "add", this.mainListView.addRow );
				this.mainListView.collection.bind( "add", this.render );
				this.mainListView.collection.bind( "remove", this.render );
				//this.mainMapView = new VU.MapView({collection:this.colls.halls, mapNode: "hallsMap"});
			},
			
			// every change to this coll means a complete redraw cuz it could add in any order, or delete
			render : function() {
				this.mainListView.el.innerHTML = "";
				this.mainListView.render();
			}
		})
	};
    
/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var AppController = VU.PersistentRouter.extend({
		routeParams : { 
			tab : "Dances",
			dates : new Date().getTime().toString(),
			coords : "",
			popID : ""
		},
		
		instanciatedViews : {},
		
		// Initialize happens at page load; think RESTful: every time this is called we're starting from scratch
        initialize : function(){
			VU.PersistentRouter.prototype.initialize.call(this);
			_.bindAll( this, "routeHandler", "authSessionCallback" );
			
			this.colls = {
				bands : new VU.BandCollection(),
				halls : new VU.HallCollection()
			};
			this.colls.events = new VU.EventCollection( null, {
				schema: VU.schemas.events.listing, 
				colls: this.colls
			});

			// init misc UI pieces
			this.popupView = new VU.PopupView( );
			utils.waitingUI.init( ".loadingGIF" );
			
			// Authenticate session and create session state model
			var mySession = new VU.AuthSessionModel( { dCard:new VU.DCardCollection( null, { events:this.colls.events } ) } );
			mySession.load( this.authSessionCallback );
			
			// check cookies for existing Auth id (can only have one at a time)
			// if exists then get if from the db; failure sends to login screen
			// if success then use it
        },
		
		authSessionCallback : function( mySession ) {
			if ( mySession.fetched ) {
				// yay!  
				// TODO: remove login link
				// TODO: create cookie
			} else {
				// TODO: if no cookie then keep login button visible and create new, anon session
				// from here on it's anon; show login link
			}
			
			// stuff to do for all sessions
			this.colls.dCard = mySession.get( "dCard" );
			
			// setup globals
			window.submitLogin = function ( loginForm ) {
				mySession.login( loginForm.username.value, loginForm.password.value );
				return false;
			};
			
		},
		
		routeHandler : function( tab, dates, coords, popID ) {
			var viewClass = ParentViews[ tab + "View" ] || ParentViews[ (tab = this.routeParams.tab) + "View" ],
				myView = this.instanciatedViews[ tab ] || new viewClass( {colls:this.colls} ),
				filter = { startkey:[], endkey:[] };
			if ( this.currentView && this.currentView != myView )
				this.currentView.deactivate();
			
			// done manipulating params (tab, specifically) so we can now save the route
			this.saveRoutes( tab, dates, coords, popID );
			
			// create filter query
			if ( dates ) {
				dates = dates.split(",");				
				filter.startkey.push(parseInt(dates[0]));
				filter.endkey.push(dates.length == 1 ? "Z" : parseInt(dates[1]));
			} else {
				filter.startkey.push(0);
				filter.endkey.push("a");
			};
			
			if ( coords ) {
				// "top-lat,left-long,bottom-lat,right-long"
				coords = coords.split(",");
				filter.startkey.push(parseFloat(coords[0]));
				filter.endkey.push(parseFloat(coords[1]));
				filter.startkey.push(parseFloat(coords[2]));
				filter.endkey.push(parseFloat(coords[3]));
			} else {
				filter.startkey.push(0);
				filter.endkey.push("Z");
				filter.startkey.push(0);
				filter.endkey.push("Z");
			};
			
			myView.activate( filter );
			
			this.instanciatedViews[ tab ] = this.currentView = myView;
			
			if ( popID ) {
				var pAry = popID.split('&');
				var popType = pAry[0];
				popID = pAry[1];
				var template = "popupTemplate_" + popType;
				var docModel = this.colls[popType + "s"] && this.colls[popType + "s"].get( popID );
				if ( popID && docModel ){
					docModel.loadEvents( this.colls.events, docModel.get("type") );
					this.popupView.openPopup( docModel, template );
				} else if ( !popID && popType ) {
					this.popupView.openPopup( null, template );
				} else {
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

