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
				this.listView = new VU.FilteredListView({
					el:"#dancesList",
					emptyMsg: "<i>No dances meet your search criteria!</i>",
					pageLimit:15,
					listingClass:VU.EventListingView,
					collection: new VU.LocalFilteredCollection( null, {collection: this.colls.events })
				});
				this.mapView = new VU.MapView( {el: "#dancesMap", collection:this.colls.halls});
				this.calView = new VU.CalView( {el: "#dancesCal"});
			},
			
			activate : function ( filters ) {
				VU.ParentView.prototype.activate.call(this);
				this.listView.applyFilters( filters );
			}
		}),

		BandsView : VU.ParentView.extend({
			el : $("#bandsDiv"),
			tabEl : $("#bandsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				this.listView = new VU.FilteredListView({
					el: "#bandsList",
					emptyMsg: "<i>No bands meet your search criteria!</i>",
					pageLimit: 15,
					collection:new VU.LocalFilteredCollection( null, { collection: this.colls.bands })
				});
				this.tagView = new VU.TagCloudView({collection:this.colls.bands, el: "#bandsTags"});
				if ( this.colls.bands.fetched) 
					this.tagView.render(); 
				else 
					this.colls.bands.bind("refresh", this.tagView.render() );
			},
			
			activate : function ( filters ) {
				VU.ParentView.prototype.activate.call(this);
				this.listView.applyFilters( filters );
			}			
		}),
		
		HallsView : VU.ParentView.extend({
			el : $("#hallsDiv"),
			tabEl : $("#hallsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				//this.listView = new VU.ListView({collection: this.colls.halls, el: "#hallsList"});
				this.listView = new VU.FilteredListView({
					el: "#hallsList",
					emptyMsg: "<i>No dance halls meet your search criteria!</i>",
					pageLimit: 15,
					collection: new VU.LocalFilteredCollection( null, {collection: this.colls.halls })
				});
				this.mapView = new VU.MapView({collection: this.colls.halls, el: "#hallsMap"});
			},
			
			activate : function ( filters ) {
				VU.ParentView.prototype.activate.call(this);
				this.listView.applyFilters( filters );
			}
		}),
		
		DanceCardView : VU.ParentView.extend({
			el : $("#danceCardDiv"),
			tabEl : $("#dCardTabBtn"),
			initialize : function() {
				_.bindAll( this, "render" );
				VU.ParentView.prototype.initialize.call(this);

				// create our main list and map views and attach the collection to them
				this.listView = new VU.FilteredListView({
					el:"#dCardList",
					emptyMsg: "<i>No dances on your card yet!<br/>Go to the Dances tab and add some!</i>",
					listingClass:VU.EventListingView,
					collection: this.colls.dCard 
				});
				//this.mainMapView = new VU.MapView({collection:this.colls.halls, mapNode: "hallsMap"});
				
			},
			
			activate : function ( filters ) {
				VU.ParentView.prototype.activate.call(this);
				this.listView.applyFilters( [{key:"onDCard", start:"true", end:"true"}] );
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
			popID : "",
			style : ""
		},
		
		instanciatedViews : {},
		mySession : {},
		
		// Initialize happens at page load; think RESTful: every time this is called we're starting from scratch
        initialize : function(){
			VU.PersistentRouter.prototype.initialize.call(this);
			_.bindAll( this, "routeHandler" );
			
			// create all master collections (these hold all models are filtered locally)
			var colls = this.colls = {
				bands : new VU.BandCollection(),
				halls : new VU.HallCollection()
			};
			colls.events = new VU.EventCollection( null, { schema: VU.schemas.events.listing, colls: colls } ); 
			colls.dCard = new VU.LocalFilteredCollection( null, { collection: colls.events } );
			
			// init misc UI pieces
			this.popupView = new VU.PopupView();
			utils.waitingUI.init( ".loadingGIF" );
			
			// Authenticate session and create session state model
			window.mySession = new VU.MemberModel( null, { dCard: this.colls.dCard, events: this.colls.events } );
			
			var floatNav = new FloatNavView();
		},
		
		routeHandler : function( tab, dates, coords, popID, style ) {
			var viewClass = ParentViews[ tab + "View" ] || ParentViews[ (tab = this.routeParams.tab) + "View" ],
				myView = this.instanciatedViews[ tab ] || new viewClass( {colls:this.colls} ),
				filters = [];
			if ( this.currentView && this.currentView != myView )
				this.currentView.deactivate();
			
			// done manipulating params (tab, specifically) so we can now save the route
			this.saveRoutes( tab, dates, coords, popID, style );
			
			// create filters from route
			if ( dates ) {
				// "start-date,end-date
				dates = dates.split(",");				
				filters.push({
					key: "dateUnix", 
					start: parseInt(dates[0]), 
					end: dates.length == 1 ? "zzz" : parseInt(dates[1])
				});
			}
			
			//TODO: will have to split up model.gpscoord to .lat and .long
			if ( coords ) {
				// "top-lat,left-long,bottom-lat,right-long"
				coords = coords.split(",");
				filters.push({
					key: "lat",
					start: parseFloat(coords[0]),
					end: parseFloat(coords[2])
				});
				filters.push({
					key: "lng",
					start: parseFloat(coords[1]),
					end: parseFloat(coords[3])
				});
			};
			
			if ( style ) {
				filters.push({
					key: "stylesPlayed",
					start: style,
					end: style
				});
			}
			
			//TODO: put this into mySession
			window.TDHP_tab = tab;
			window.TDHP_filters = filters;
			myView.activate( filters );
			
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
					case "addEvent": 
					case "member": 
						docModel = window.mySession; 
						break;
					default: 
						docModel = this.colls[popType + "s"] && this.colls[popType + "s"].get( popID );
						//TODO: if docModel doesn't exist then fetch it!
				};
				
				if ( docModel ) {
					if ( _.isFunction(docModel.loadEvents) )
						docModel.loadEvents( this.colls.events );
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

