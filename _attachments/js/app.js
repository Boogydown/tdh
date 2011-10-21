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
				this.navColl = new VU.LocalFilteredCollection( null, {collection: this.colls.events, name:"dances" });
				this.navCaption = "All #{type} with upcoming events."
				
				// create our main list and map views and attach the collection to them
				this.listView = new VU.FilteredListView({
					el:"#dancesList",
					emptyMsg: "<i>No dances meet your search criteria!</i>",
					pageLimit:15,
					listingHeight: 80,
					listingClass:VU.EventListingView,
					collection: this.navColl
				});
				this.calView = new VU.CalView( {el: "#dancesCal"});
			},
			
			activate : function ( filters ) {
				VU.ParentView.prototype.activate.call(this);
				//this.listView.applyFilters( filters );
				this.listView.applyFilters( [{}] );
				this.listView.scrollTo("dateUnix", _.detect( filters, function(f){return f.key == "dateUnix";} ).start);
				if ( !this.mapView ) 
					this.mapView = new VU.MapView( {el: "#dancesMap", collection:this.colls.events});
			}
		}),

		BandsView : VU.ParentView.extend({
			el : $("#bandsDiv"),
			tabEl : $("#bandsTabBtn"),
			
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				this.navColl = new VU.LocalFilteredCollection( null, { collection: this.colls.bands, name:"bands" });
				this.navCaption = 'All #{style} bands containing #{searchStr}.'
				this.listView = new VU.FilteredListView({
					el: "#bandsList",
					emptyMsg: "<i>No bands meet your search criteria!</i>",
					pageLimit: 15,
					listingHeight: 92,
					collection: this.navColl
				});
				this.bandSearch = new VU.SearchBoxView( {el:"#searchBandName", model:this.listView, filterKey:"bandName"} );
				this.tagView = new VU.TagCloudView({collection:this.colls.bands, el: "#bandsTags"});
			},
			
			activate : function ( filters ) {
				// TODO: this.navCaption - only add search string verbiage if there is a search str in filters
				VU.ParentView.prototype.activate.call(this);
				this.listView.applyFilters( filters );
				//this.tagView.render();  this happens at refresh, within tagView
			}
		}),
		
		HallsView : VU.ParentView.extend({
			el : $("#hallsDiv"),
			tabEl : $("#hallsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				this.navColl = new VU.LocalFilteredCollection( null, {collection: this.colls.halls, name:"halls" });
				this.navCaption = "All halls containing #{nameSearch} and located in #{countySearch} county";
				this.listView = new VU.FilteredListView({
					el: "#hallsList",
					emptyMsg: "<i>No dance halls meet your search criteria!</i>",
					pageLimit: 15,
					listingHeight: 92,
					collection: this.navColl
				});
				this.nameSearch = new VU.SearchBoxView( {el:"#searchHallName", model:this.listView, filterKey:"danceHallName"} );
				this.countySearch = new VU.SearchBoxView( {el:"#searchHallCounty", model:this.listView, filterKey:"county"} );
			},
			
			activate : function ( filters ) {
				// TODO: this.navCaption - only add search string or map verbiage if they're in filters
				VU.ParentView.prototype.activate.call(this);
				this.listView.applyFilters( filters );
				if ( !this.mapView ) 
					this.mapView = new VU.MapView({collection: this.colls.halls, el: "#hallsMap"});
			}
		}),
		
		DanceCardView : VU.ParentView.extend({
			el : $("#danceCardDiv"),
			tabEl : $("#dCardTabBtn"),
			initialize : function() {
				_.bindAll( this, "render" );
				VU.ParentView.prototype.initialize.call(this);
				this.navColl = this.colls.dCard;
				this.navCaption = "All dances on your Dance Card";

				// create our main list and map views and attach the collection to them
				this.listView = new VU.FilteredListView({
					el:"#dCardList",
					emptyMsg: "<i>No dances on your card yet!<br/>Go to the Dances tab and add some!</i>",
					listingHeight: 92,
					listingClass:VU.EventListingView,
					collection: this.navColl 
				});
			},
			
			activate : function ( filters ) {
				VU.ParentView.prototype.activate.call(this);
				if ( this.listView.collection.length > _.size( this.listView.listingViews ) )
					this.listView.render();
				//else ** we don't really need to re-apply filters; they're already there from memberModel...
					//this.listView.applyFilters( [{key:"onDCard", start:"true", end:"true"}] );
				//this.mainMapView = new VU.MapView({collection:this.colls.halls, mapNode: "hallsMap"});
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
				bands : new VU.BandCollection(null, {name:"bandsMaster"}),
				halls : new VU.HallCollection(null, {name:"hallsMaster"})
			};
			colls.events = new VU.EventCollection( null, { schema: VU.schemas.events.listing, colls: colls, name:"eventsMaster" } ); 
			colls.dCard = new VU.LocalFilteredCollection( null, { collection: colls.events, name:"dcard" } );
			
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
			
			//TODO: create FilterModel....   can also check popID.changed to see if should skip redraw
			//this.myFilters.set( {
				//tab: tab,
				//dates: dates,
				//coords: coords,
				//popID: popID,
				//style: style
			//});
			
			// create filters from route
			if ( dates ) {
				// "start-date,end-date
				dates = dates.split(",");
				filters.push({
					key: "dateUnix", 
					//per client request, show up to two days previous:
					start: parseInt(dates[0]) - 2 * 24 * 60 * 60 * 1000,
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
					this.popupView.openPopup( 
						docModel, 
						template, 
						this.currentView.navColl, 
						this.currentView.navCaption 
					);
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

