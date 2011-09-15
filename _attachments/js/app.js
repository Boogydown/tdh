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
				this.tagView = new VU.TagCloudView( {collection:this.colls.bands, el: "#bandsTagsList"});
			},
			
			activate : function ( filter ) {
				VU.ParentView.prototype.activate.call(this);
				this.mainListView.applyFilter( filter );
				this.tagView.render( {height:370, type:"list", sizemin:8});
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
				//this.mainMapView = new VU.MapView({collection:this.colls.halls, mapNode: "hallsMap"});
				
				// every change to this coll means a complete redraw cuz it could add in any order, or delete
				this.mainListView.collection.unbind( "add", this.mainListView.addRow );
				this.mainListView.collection.bind( "add", this.mainListView.reset );
				this.mainListView.collection.bind( "remove", this.mainListView.reset );
			}
		})
	};
	
	var FloatNavView = Backbone.View.extend({
		initialize : function () {
			mySession.bind( "change:loggedIn", this.toggleLogView )
		},
		
		toggleLogView : function() {
			if ( mySession.get( "loggedIn" ) ) {
				$("#loggedOutNav").hide();
				$("#loggedInNav").show();
			} else {
				$("#loggedOutNav").show();
				$("#loggedInNav").hide();
			}
		}
	});
    
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
		mySession : {},
		
		// Initialize happens at page load; think RESTful: every time this is called we're starting from scratch
        initialize : function(){
			VU.PersistentRouter.prototype.initialize.call(this);
			_.bindAll( this, "routeHandler" );
			
			this.colls = {
				bands : new VU.BandCollection(),
				halls : new VU.HallCollection()
			};
			this.colls.events = new VU.EventCollection( null, {
				schema: VU.schemas.events.listing, 
				colls: this.colls
			});
			this.colls.dCard = new VU.DCardCollection( null, { events:this.colls.events } );

			// init misc UI pieces
			this.popupView = new VU.PopupView();
			utils.waitingUI.init( ".loadingGIF" );
			
			// init the danceCard view so it can load any persisted stuff
			this.instanciatedViews[ "DanceCard" ] = new ParentViews.DanceCardView( {colls:this.colls} );
			
			// Authenticate session and create session state model
			window.mySession = new VU.MemberModel( null, { dCard: this.colls.dCard, events: this.colls.events } );
			
			var floatNav = new FloatNavView();
		},
		
		routeHandler : function( tab, dates, coords, popID ) {
			var viewClass = ParentViews[ tab + "View" ] || ParentViews[ (tab = this.routeParams.tab) + "View" ],
				myView = this.instanciatedViews[ tab ] || new viewClass( {colls:this.colls} ),
				filter = { startkey:[], endkey:[] };
			if ( this.currentView && this.currentView != myView )
				this.currentView.deactivate();
			
			// done manipulating params (tab, specifically) so we can now save the route
			this.saveRoutes( tab, dates, coords, popID );
			//TODO: put this into mySession
			window.TDHP_tab = tab;
			
			// create filter query
			if ( dates ) {
				dates = dates.split(",");				
				filter.startkey.push(parseInt(dates[0]));
				filter.endkey.push(dates.length == 1 ? [] : parseInt(dates[1]));
			} else {
				filter.startkey.push(0);
				filter.endkey.push([]);
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
				filter.endkey.push([]);
				filter.startkey.push(0);
				filter.endkey.push([]);
			};
			
			myView.activate( filter );
			
			this.instanciatedViews[ tab ] = this.currentView = myView;
			
			if ( popID ) {
				var pAry = popID.split('&');
				var popType = pAry[0];
				popID = pAry[1];
				var template = "popupTemplate_" + popType,
					docModel;
				switch ( popType ) {
					case "login": 
					case "signup": 
					case "member": 
						docModel = window.mySession; 
						break;
					default: 
						docModel = this.colls[popType + "s"] && this.colls[popType + "s"].get( popID );
						//TODO: if docModel doesn't exist then fetch it!
				};
				
				if ( docModel ) {
					if ( _.isFunction(docModel.loadEvents) )
						docModel.loadEvents( this.colls.events, docModel.get("type") );
					this.popupView.openPopup( docModel, template );
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

