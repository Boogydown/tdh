VU.InitModels = function () {
/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{

//A Model that persists any keys stored in this.cookieKeys to the document cookies
VU.CookieModel = Backbone.Model.extend({
	prefix : "vu_",
	
	//syntax: will write only model values that are in this.cookieKeys array
	writeCookies : function() {
		var i, key, val, cookie;
		for ( i in this.cookieKeys ){
			key = this.cookieKeys[i];
			val = this.get( key );
			if ( val !== undefined ){
				cookie = this.prefix + key + "=" + JSON.stringify(val);
				document.cookie = cookie;
				console.log("writeCookies() is writing cookie: " + cookie );
			}
		}
		if ( this.id ) this.save();
	},
	
	readCookies : function() {
		var cookies = document.cookie.split('; '), tmp = {}, plen = this.prefix.length,
			cook, cookary, cookiesObj = {}, success = false, key;
		if ( cookies.length > 0 ) {
			for ( cook in cookies ){
				cookary = cookies[cook].split("=");
				if ( cookary[0].substr(0,plen) == this.prefix ) {
					key = cookary[0].substr(plen);
					cookiesObj[key] = cookary[1];
					if ( this.cookieKeys.indexOf(key) > -1 ) {
						try{
							tmp[key] = JSON.parse( cookary[1] );
							success = true;
						} catch(e) {}
					}
				}
			}
		}
		tmp.cookiesObj = cookiesObj;
		console.log( "readCookies() is setting: " + JSON.stringify( tmp ) );
		this.set( tmp );
		return success;
	}
});

// contains current user info and auth stuff **Only one instance**
VU.MemberModel = VU.CookieModel.extend({
	url : "_users",
	fetched : false,
	cookieKeys : [ "id", "dCard" ],
	ID_PREFIX: "org.couchdb.user:",
	defaults : {
		realName: "J. Dancer",
		name: "",
		group: "",
		lastLogin: new Date().getTime(),
		password: "", //this is wiped out by the server when it returns an auth'd session
		memberStatus: "unpaid",
		dCard: [],
		loggedIn: false
	},
	
	initialize : function( attrs, options ) {
		_.bindAll( this, "fetchUser", "prepAnon", "userLoaded", "loginSuccess", "loginError", 
						 "submitLogin", "submitSignup", "logout", "loadDCard", "syncDCard" );
		if ( options ) {
			this.dCardColl = options.dCard;
			this.eventsMain = options.events;
		}
		
		if ( this.readCookies() ) {
			// any cookies loaded?  dcard?  userID?
			this.cookieDCard = this.get("dCard");
			if ( this.id )
				// ooh, a userID!  let's attempt to fetch it...
				this.fetchUser();
			else
				// we're running anon....
				this.prepAnon();
		} else 
			// no cookies loaded, so anonymous all the way
			this.prepAnon();
	},

	fetchUser : function() {
		if ( !this.id )
			this.id = this.ID_PREFIX + this.get( "name" );
		this.fetch( {success: this.userLoaded, error: this.prepAnon} );
	},	
	
	// for anonymous sessions
	prepAnon : function() {
		this.loadDCard();
		// save, in case the dCard was from cookie or user
		this.writeCookies();			
	},
	
	userLoaded : function () {
		// this should attempt to write to _users, which will return an error if not authed any more
		this.save( {}, {success: this.loginSuccess, error: this.prepAnon} );
	},
	
	loginSuccess : function() {
		alert("Success!  you're logged in, " + this.get("realName") );		
		this.set( { loggedIn: true }, { silent: true } );
		this.unset( "password" );
		this.loadDCard();
		this.writeCookies();		
	},
	
	loginError : function(e){
		alert("Uh oh!! Unable to login.  Username and password incorrect?\n" + e);
		this.prepAnon();
	},
	
	submitLogin : function ( form ) {
		if ( form ) this.set({ name: form.name.value, password: form.password.value });
		$.couch.login( {
			name: this.get("name"), 
			password: this.get("password"), 
			success: this.fetchUser, 
			error: this.loginError 
		});
		form.reset();
		return false;
	},		
	
	submitSignup : function ( form ) {
		if ( form ) this.set({ 
			realName: form.realName.value, 
			name: form.name.value, 
			password: form.password.value
		});
		$.couch.signup( 
			this.attributes, 
			this.get("password"), 
			{ success: this.loginSuccess, error: this.loginError } 
		);
		form.reset();
		return false;
	},		
	
	logout : function() {
		this.set({id:"", loggedIn:false});
		this.writeCookies();
		$.couch.logout();
	},
	
	// intended to break until the events are loaded, then we can continue to set them
	loadDCard : function() {
		if ( this.eventsMain.fetched ) {
			
			// once events are fetched then we set the dCard for all matching ids in the dCard array
			this.eventsMain.unbind( "refresh", this.loadDCard );
			
			// cookie dCard takes precedence over logged-in one
			if ( this.cookieDCard && this.cookieDCard.length > 0 ) {
				this.set( {dCard: this.cookieDCard } )
				this.cookieDCard = null;
			}
			var dCard = this.get( "dCard" ), events = this.eventsMain;
			if ( dCard && dCard.length > 0 ) {
				_.each( dCard, function (eventId) {
					events.get( eventId ).set( {onDCard: true} );
				});
			}
			
			// now, so that we can make dCardColl alive earlier, before the DCard tab is opened:
			this.dCardColl.applyFilters( [{key:"onDCard", start:"true", end:"true"}] );
			
			// to keep us in sync as things are added
			this.dCardColl.bind( "add", this.syncDCard );
			this.dCardColl.bind( "remove", this.syncDCard );			
		}
		else
			this.eventsMain.bind( "refresh", this.loadDCard );
	},
	
	syncDCard : function() {
		this.set( {dCard: this.dCardColl.pluck( "id" )} );
		this.writeCookies();
	}
});

//VU.AuthSessionModel = VU.CookieModel.extend({
VU.AuthSessionModel = VU.MemberModel.extend({
	
	cookieKeys: [ "id" ],
	
	// default timeout is 10 minutes
	DEFAULTTIMEOUT : 10 * 60 * 1000,
	
	defaults : {
		//member: {},
		permissions: {}, // as taken from your group
		ticket: "", //a copy of the cookie ticket
		//TODO: will need to somehow update this timeout on every user or HTTP action
		//NOTE: this is static, but since there is only one session per app isntance, that's ok
		timeout: new Date().getTime() + this.DEFAULTTIMEOUT
	},
	
	initialize : function() {
		_.bindAll( this, "load", "login", "closeSession" );
	},
	
	load : function( completeCallback ) {
		var sessionID = this.readCookie();
		if ( sessionID ) {
			// if cookie exists then there is an active session; 
			//	create session model and retrieve it from the db
			this.fetch( {success:completeCallback});
		}
		else
		{
			//TODO: if no user session then only state we really care about is dCard, so instead
			//	of wasting db space for this we just store it in a cookie
			//var dcard = window.utils.readCookie( "tdh_dcard", ";" );
			
			completeCallback( this );
		}			
	},
	
	login : function( username, password ) {
		//TODO: process login
		//	submit u & p for auth
		//	get user model back
		// 	create session model
		//	save session to server
	},
	
	closeSession : function() {
		//TODO: remove cookie
	}
	
});

// An entity that has events associated to it
VU.EventsContainerModel = Backbone.Model.extend({
	initialize : function( ) {
		_.bindAll( this, "loadEvents" );
	},
	
	// load all events that have a band or hall (ofType) of this id
	//TODO: ofType needs to be more dependant on schema... we're currently assuming that the type is the same as the linkingRef
	loadEvents : function ( eventsCollection ) {
		var myEvents = new VU.LocalFilteredCollection( null, {collection: eventsCollection, name:this.name } ),
			myId = this.id, 
			ofType = this.myType;
		myEvents.applyFilters( [{key: ofType, start: myId, end: myId}] );
		this.set( {events: myEvents} );
	}
});

// A model with attributes that link to other models
VU.LinkingModel = Backbone.Model.extend({
	linkRefs : {},
	initialize : function ( attributes, options) {
		_.bindAll( this, "loadLinkRefs", "loadLinkVals" );
		this.bind ( "change", this.loadLinkRefs );
		this.bind ( "add", this.loadLinkRefs );
		
		// Loads all of the refs and values from schema for processing later
		// this.linkRefs is a dict where key is the linkref property name (i.e. band) and
		//	value is a dict where key is linkval property name (i.e. band name) and value
		//	is its cell lookup name (within the linkref model)
		var fields = this.options && this.options.schema && this.options.schema.properties || 
					 this.collection.schema && this.collection.schema.properties ||
					 {};
		var curLinkVal;
		for ( var attr in fields )
		{
			if ( fields[attr].linkRef ){
				(this.linkRefs[attr]) || (this.linkRefs[attr] = {});
				this.linkRefs[attr].coll = fields[attr].linkRef;
			}
			curLinkVal = fields[attr].linkVal;
			if ( curLinkVal ){
				curLinkRef = this.linkRefs[ curLinkVal.linkRef ];
				(curLinkRef) || (curLinkRef = {});
				(curLinkRef.linkVals) || (curLinkRef.linkVals = {});
				curLinkRef.linkVals[attr] = curLinkVal.cell;
			}
		}
	},
	
	loadLinkRefs : function (  ) {
		// we only want to load on the first add
		this.unbind ( "add", this.loadLinkRefs );
		var colls = this.collection && this.collection.colls;
		if ( !colls ) return;
		var attr, loadingQueue = {}, docID, coll, myRef;
		// load all referenced models so that we can pull data from them
		for ( attr in this.linkRefs )
		{
			// this attribute's value in the model is the doc ID of the link
			docID = this.get(attr);
			if ( docID )
			{
				if ( _.isArray(docID) && docID.length ) docID = docID[0];
				coll = colls[ this.linkRefs[attr].coll ];
				if ( coll )
				{
					//TODO: great opportunity to bulk load, here
					myRef = coll.get( docID );
					// if reference not loaded yet, then create and fetch it
					if ( ! myRef ) {
						myRef = new coll.model( { id:docID } ); 
						myRef.linkRef = this.linkRefs[attr];
						myRef.bind( "change", this.loadLinkVals);
						coll.add( myRef );
						myRef.fetch();
					}
					// otherwise, load the old one
					else {
						myRef.linkRef = this.linkRefs[attr];
						myRef.bind( "change", this.loadLinkVals );
						// if already fetched then just pull the data
						if ( myRef.fetched || (myRef.collection && myRef.collection.fetched) )
							this.loadLinkVals( myRef );
					}
				}
			}
		}
	},
	
	loadLinkVals : function ( myRef ) {
		if ( !myRef )
			console.log("myRef undefined");
		myRef.fetched = true;
		var linkMatch, destAttr, linkVals = myRef.linkRef.linkVals;
		
		for ( destAttr in linkVals )
		{
			linkMatch = {};
			// necessary trick to allow for variable key
			linkMatch[destAttr] = myRef.get( linkVals[destAttr] );
			this.set( linkMatch, {silent:true} ); //postpone change trigger til after all vals set
		}
		// kick off change to all of this model's listeners, EXCEPT itself
		this.unbind( "change", this.loadLinkRefs );
		this.trigger("change", this );
		this.bind( "change", this.loadLinkRefs );		
	}
});

// Band model
VU.BandModel = VU.EventsContainerModel.extend({
	myType : "band",
	defaults : {
		bandName: "Generic Band",
		image: "images/genericSilhouette.jpg",
		bio: "They play musical instruments.",
		events: null
	},
	
	initialize : function ( attrs, options ) { 
		VU.EventsContainerModel.prototype.initialize.call( this, attrs, options );
		this.name = _.uniqueId( "band" );
		_.bindAll( this, "normalizeAttributes", "searchComplete" );
		this.bind( "change:image", this.normalizeAttributes );		
		this.bind( "change:stylesPlayed", this.normalizeAttributes );		
		this.bind( "change:website", this.normalizeAttributes );		
		this.bind( "change:bandName", this.normalizeAttributes );		
		// kick it off once for those that came in at init
		this.normalizeAttributes();
	},
	
	//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; },

	normalizeAttributes : function () {
		// image and website
		var bandID = this.id;
		var bandPic = this.get("image");
		var entryDescription = this.get("stylesPlayed");
		if ( _.isArray(entryDescription) ) entryDescription = entryDescription.join(", ") + ". ";
		
		this.set( {
			website: (this.get("website")||"").split("://").pop(),
			name: this.get("bandName"),
			entryDescription: entryDescription
		}, { silent: true } );
		
		if ( bandPic && bandPic != this.defaults.image && bandPic.substr(0, 4) != "http" ) {
			bandPic = "../../" + bandID + "/thumbs/" + encodeURI( bandPic );
			this.set( { 
				thumbPic: bandPic, 
				mainPic: bandPic.replace( "\/thumbs\/", "\/files\/" )
			}, { silent: true } );
		}
		else
			if ( window.google ) this.getGoogleImage();
	},
	
	imageSearch: {}, 
	
	getGoogleImage : function () {
		try {
			this.imageSearch = new google.search.ImageSearch();
			this.imageSearch.setSearchCompleteCallback(this, this.searchComplete, null);
			this.imageSearch.execute(this.get( "bandName" ));
			//google.search.Search.getBranding('branding');
		}
		catch (e) {console.log("Cannot load Google Images API: " + e);}
	},
	
	searchComplete : function() {
		if ( this.imageSearch.results && this.imageSearch.results.length > 0 ) {
			var result = this.imageSearch.results[0];
			this.set({
				thumbPic: result.tbUrl,
				mainPic: result.url
			});
		}
	}
});

// Venue model
VU.VenueModel = VU.EventsContainerModel.extend({
	myType : "hall",
	defaults : {
		images: [{"credit":"generic", "image":"images/genericHall.JPG"}],
		documents: [],
		events: null
	},	

	initialize : function ( attrs, options ) { 
		VU.EventsContainerModel.prototype.initialize.call( this, attrs, options );
		this.name = _.uniqueId( "hall" );
		_.bindAll( this, "normalizeAttributes" );
		this.bind( "change:images", this.normalizeAttributes );		
		this.bind( "change:dateBuilt", this.normalizeAttributes );		
		this.bind( "change:historicalNarrative", this.normalizeAttributes );		
		this.bind( "change:website", this.normalizeAttributes );		
		this.bind( "change:danceHallName", this.normalizeAttributes );		
		// kick it off once for those that came in at init
		this.normalizeAttributes();
	},
	
	//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; }
	
	normalizeAttributes : function () {
		// images and website
		var hallID = this.id;
		var hallPic = this.get("images")[0];
		if ( hallPic )
			hallPic = hallPic.image;
		else 
			hallPic = this.defaults.images[0].image;
		if ( hallPic != this.defaults.images[0].image )
			hallPic = "../../" + hallID + "/thumbs/" + encodeURI( hallPic );
			// TODO: check to see if this URL exists... ?  perhaps try <img src.... onerror=""/>
			
		var entryDescription = this.get("dateBuilt");
		if ( entryDescription ) 
			entryDescription = "cir. " + entryDescription + ". ";
		entryDescription += this.get("historicalNarrative");
		
		var lat, lng, gps = this.get( "GPS Coordinates" ) || this.get( "gpsCoordinates" );
		if ( gps ){
			gps = gps.split(" ");
			if ( gps.length < 2 ) 
				gps = gps[0].split(",");
			if ( gps.length > 1 ) {
				lat = gps[1];
				lng = gps[0];
			}
		}		
		
		this.set( { 
			thumbPic: hallPic,
			mainPic: hallPic.replace( "\/thumbs\/", "\/files\/" ), 
			website: (this.get("website")||"").split("://").pop(),
			name: this.get("danceHallName"),
			entryDescription: entryDescription,
			lat: lat,
			lng: lng
		}, { silent: true } );
	}
});

// Event model
VU.EventModel = VU.LinkingModel.extend({
	defaults : {
		date: new Date().getTime(),
		time: "8:00 PM",
		onDCard: false // for local use, only
	},
	
	initialize: function ( attrs, options ) {
		this.name = _.uniqueId( "event" );
		_.bindAll( this, "normalizeData" );
		this.bind( "change:date", this.normalizeData );
		this.bind( "change:hall", this.normalizeData );
		this.bind( "change:date", this.normalizeData );
		this.bind( "change:gpsCoordinates", this.normalizeData );
		// date comes in at init, silently, so we'll normalize it now
		VU.LinkingModel.prototype.initialize.call(this, attrs, options);
		this.normalizeData(); 
	},
	
	toggleDCard : function () {
		// no silent... we want listeners to pick it up
		var newDCard = !this.get("onDCard");
		this.set( { onDCard: newDCard } );
		return newDCard;
	},
	
	normalizeData : function () {
		var myDateStr = this.get("date");
		var myDate = myDateStr instanceof Date ? myDateStr : new Date( myDateStr );
		if ( myDate.toString() == "Invalid Date" || ! myDate.getTime() ) {
			console.log( "Invalid date: " + (myDateStr == "" ? "(empty string)" : myDateStr) + ".  Using today's date." );
			myDate = new Date();
		}
		
		var lat, lng, gps = this.get( "gpsCoordinates" );
		if ( gps ){
			gps = gps.split(" ");
			if ( gps.length < 2 ) 
				gps = gps[0].split(",");
			if ( gps.length > 1 ) {
				lat = gps[1];
				lng = gps[0];
			}
		}
		
		var band = this.get( "band" );
		if ( _.isArray( band ) )
			band = band[0];
		var hall = this.get( "hall" );
		if ( _.isArray( hall ) )
			hall = hall[0];
		
		this.set({
			//TODO: make this a date util
			dateDay: ["SUN","MON","TUE","WED","THU","FRI","SAT"][myDate.getDay()],
			dateDate: myDate.getDate(),
			dateMonth: ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEPT","OCT","NOV","DEC"][myDate.getMonth()],
			dateUnix: myDate.getTime(),
			lat: lat,
			lng: lng,
			band: band,
			hall: hall
		}, {silent:true});
	}
});

// Model that facilitates easy accessing and parsing of filter data as retrieved from the URL hash
VU.FilterModel = Backbone.Model.extend({
	
});
};