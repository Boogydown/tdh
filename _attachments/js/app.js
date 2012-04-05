	$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "crossFilter";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;
	
	$.ajaxSetup({cache: false});
	
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
				
				// we'll need to fetch this for the map.
				if ( !this.colls.halls.fetched && !this.colls.halls.fetching )
					this.colls.halls.fetch();				
			},
			
			activate : function ( filters ) {
				VU.ParentView.prototype.activate.call(this);
				//this.listView.applyFilters( filters );
				this.listView.applyFilters( [{}] );
				this.listView.scrollTo("dateUnix", _.detect( filters, function(f){return f.key == "dateUnix";} ).start);
				if ( !this.mapView ) 
					this.mapView = new VU.MapView( {el: "#dancesMap", collection:this.navColl, masterColl:this.colls.halls});
			}
		}),

		BandsView : VU.ParentView.extend({
			el : $("#bandsDiv"),
			tabEl : $("#bandsTabBtn"),
			
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				this.navColl = new VU.LocalFilteredCollection( null, { collection: this.colls.bands, name:"bands" });
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
				VU.ParentView.prototype.activate.call(this);
				this.listView.applyFilters( filters );
				if ( !this.tagView.rendered )
					// in case it never received the reset() command.
					this.tagView.render();  
			}
		}),
		
		HallsView : VU.ParentView.extend({
			el : $("#hallsDiv"),
			tabEl : $("#hallsTabBtn"),
			initialize : function() {
				VU.ParentView.prototype.initialize.call(this);
				this.navColl = new VU.LocalFilteredCollection( null, {collection: this.colls.halls, name:"halls" });
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
				VU.ParentView.prototype.activate.call(this);
				this.listView.applyFilters( filters );
				if ( !this.mapView ) 
					this.mapView = new VU.MapView({collection: this.navColl, masterColl: this.colls.halls, el: "#hallsMap"});
			}
		}),
		
		DanceCardView : VU.ParentView.extend({
			ST_PREFIX : "http://rest.sharethis.com/share/sharer.php?pub_key=0d37266b-9e92-4ecd-82e7-1ac5fb707fd0&access_key=9b10faf230c5eeae9fce93e224871d15&title=My%20Texas%20Dance%20Hall%20Events&url=",
			el : $("#danceCardDiv"),
			tabEl : $("#dCardTabBtn"),
			initialize : function() {
				_.bindAll( this, "render", "processDCardChange" );
				VU.ParentView.prototype.initialize.call(this);
				var nc = this.navColl = this.colls.dCard;

				// create our main list and map views and attach the collection to them
				this.listView = new VU.FilteredListView({
					el:"#dCardList",
					emptyMsg: "<i>No dances on your card yet!<br/>Go to the Dances tab and add some!</i>",
					listingHeight: 92,
					listingClass:VU.EventListingView,
					collection: nc
				});
				nc.bind("add",this.processDCardChange);
				nc.bind("remove",this.processDCardChange);
				$("#removeAllButton").click( function(e){
					if ( !e.target.disabled )
						while ( nc.length > 0 )
							nc.at(0).set({onDCard:false});
				});
				$("#printDCardButton").click( window.print );
			},
			
			activate : function ( filters ) {
				VU.ParentView.prototype.activate.call(this);
				if ( this.listView.collection.length > _.size( this.listView.listingViews ) )
					this.listView.render();
				else
					this.listView.applyFilters( [{key:"onDCard", start:"true", end:"true"}] );
				if ( !this.mapView ) 
					this.mapView = new VU.MapView( {el: "#dCardMap", collection:this.navColl, addressFallback:true});

				this.actualURL = location.hash;
				this.processDCardChange();
			},
			
			processDCardChange : function() {
				// update removeall button
				if ( this.navColl.length == 0 )
					$(".dCardActionBtn").attr("disabled", true);
				else
					$(".dCardActionBtn").attr("disabled", false);
				
				if ( this.active ) 
				{
					Backbone.history.navigate( this.actualURL + "/" + this.navColl.pluck("id").join("&") );
					try{window.parent.location.hash = location.hash;}catch(e){};
				}
				var dcUrl = encodeURIComponent("http://www.TexasDanceHall.org/calendar.html" + location.hash);
				$("#st_fb").attr("href","http://rest.sharethis.com/share/sharer.php?destination=facebook&url=" + dcUrl + "&title=My%20Dance%20Card%20-%20Texas%20Dance%20Halls&pub_key=0d37266b-9e92-4ecd-82e7-1ac5fb707fd0&access_key=9b10faf230c5eeae9fce93e224871d15");
				$("#st_tw").attr("href","http://rest.sharethis.com/share/sharer.php?destination=twitter&url=" + dcUrl + "&title=My%20Dance%20Card%20-%20Texas%20Dance%20Halls&pub_key=0d37266b-9e92-4ecd-82e7-1ac5fb707fd0&access_key=9b10faf230c5eeae9fce93e224871d15");
				$("#st_em").attr("href","mailto:?subject=My%20Dance%20Card%20-%20Texas%20Dance%20Halls&body=See%20my%20favorite%20upcoming%20events%20at%20historic%20Texas%20Dance%20Halls%3A%0A" + dcUrl);
				
				// update sharethis buttons
				//var url = this.ST_PREFIX + encodeURIComponent( window.parent.location.href + "/" + this.navColl.pluck("id").join("&")) + "&destination=";
				//$("span.chicklets").unbind();
				//$("span.twitter").click(function(){window.open(url + "twitter");});
				//$("span.facebook").click(function(){window.open(url + "facebook");});
				//$("span.myspace").click(function(){window.open(url + "myspace");});
				//$("span.email").click(function(){window.open(url + "email");});
				//$('span[class^="st_"]').attr("st_url", encodeURIComponent( window.parent.location.href + "/" + this.navColl.pluck("id").join("&")));
			}
		})
	};
	
	var FloatNavView = Backbone.View.extend({
		events : {
			"click #logoutLink": "logout"
		},
		
		initialize : function () {
			_.bindAll( this, "toggleLogView", "logout" );
			this.model.bind( "change:loggedIn", this.toggleLogView )
			this.model.bind( "change:realName", this.toggleLogView )
		},
		
		toggleLogView : function() {
			if ( this.model.get( "loggedIn" ) ) {
				$("#loggedOutNav").hide();
				$("#loggedInNav").show();
				$("#memberName").text( "Welcome " + this.model.get("realName") ).show();
			} else {
				$("#loggedOutNav").show();
				$("#loggedInNav").hide();
				$("#memberName").text( "" );
			}
		},
		
		logout : function() {
			this.model.logout();
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
			style : "",
			dCard : null //null means don't save/persist this one
		},
		
		popupMap : {
			login : VU.LoginPopupView,
			signup : VU.SignupPopupView,
			member : VU.MemberPopupView,
			editMember : VU.EditPopupView,
			edithall : VU.SchemaFormHallView,
			addband : VU.SchemaFormCreateBandView,
			editband : VU.SchemaFormBandView,
			addEvent : VU.SchemaFormEventView,
			hall : VU.HallPopupView,
			dancehall : VU.HallPopupView,
			band : VU.BandPopupView
		},
		
		instanciatedViews : {},
		instanciatedPops : {},
		
		// Initialize happens at page load; think RESTful: every time this is called we're starting from scratch
        initialize : function(){
			if ( window.parent )
				try{location.hash = window.parent.location.hash;}catch(e){};
			VU.PersistentRouter.prototype.initialize.call(this);
			_.bindAll( this, "routeHandler" );
			
			this.ownerUsers = {};
			
			// create all master collections (these hold all models are filtered locally)
			var colls = this.colls = {
				bands : new VU.BandCollection(null, {name:"bandsMaster"}),
				halls : new VU.HallCollection(null, {name:"hallsMaster"})
			};
			colls.events = new VU.EventCollection( null, { schema: VU.schemas.events.listing, colls: colls, name:"eventsMaster" } ); 
			colls.dCard = new VU.LocalFilteredCollection( null, { collection: colls.events, name:"dcard" } );
			
			// init misc UI pieces
			utils.waitingUI.init( ".loadingGIF" );
			
			// Authenticate session and create session state model
			this.mySession = new VU.MemberModel( null, { dCard: this.colls.dCard, events: this.colls.events } );			
			var floatNav = new FloatNavView( { el: "#loginLinks", model:this.mySession} );
		},
		
		routeHandler : function( tab, dates, coords, popID, style, dCard ) {
			if ( dCard ) this.mySession.loadDCard( dCard );
			
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
			
			// only process filters if they're changed...
			var curFilterStr = tab + dates + coords + style;
			if ( curFilterStr != this.lastFilterStr )
			{
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
						start: decodeURI(style).toLowerCase(),
						end: decodeURI(style).toLowerCase()
					});
				}
				
				filters.push({
					key: "status",
					notStr: "gone"
				});
				
				//TODO: put this into mySession
				window.TDHP_tab = tab;
				myView.activate( filters );
				this.instanciatedViews[ tab ] = this.currentView = myView;
			}
			this.lastFilterStr = curFilterStr;
			
			if ( popID ) {
				var popAry = popID.split('&'),
					popType = popAry[0],
					popClass = this.popupMap[popType],
					popView = this.instanciatedPops[ popType ] || (this.instanciatedPops[ popType ] = new popClass({colls:this.colls}));
				popID = popAry.length > 1 ? popAry[1] : null;
				
				// open and pass respective info depending on popup type
				//if ( popView instanceof VU.EventsContainerPopupView )
				popView.openPopup( this.mySession, popID, this.currentView.navColl, popAry );
					
			} else {
				// ensure popup is closed
				if ( VU.PopupView.prototype.active )
					VU.PopupView.prototype.closePopup();
			}
			
			var b = this.colls.bands;
			if ( !b.fetched && !b.fetching )
				setTimeout( function(){ b.fetch.call( b, /*{add:true}*/{} ); },8000 );
		}
    });

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	window.app = new AppController();
	Backbone.history.start();	
});
/////////////////////////////////////////////////////////////////////////////}

