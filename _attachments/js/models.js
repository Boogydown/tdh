VU.InitModels = function () {
/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
// Holds info about the current user and their session (persisted to browser cookie)
VU.CookieModel = Backbone.Model.extend({
	prefix : "vu_",
	//syntax: will write only model values that are in this.cookieKeys array
	writeCookies : function() {
		//TODO: get() all keys in this.cookieKeys and save them to a cookie
		for ( var key in this.cookieKeys ){
			var val = this.get( key );
			if ( val !== undefined )
				document.cookie = this.prefix + key + "=" + JSON.stringify(val);
		}
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
						tmp[key] = JSON.parse( cookary[1] );
						success = true;
					}
				}
			}
		}
		tmp.cookiesObj = cookiesObj;
		this.set( tmp );
		return success;
	}
});


VU.MemberModel = VU.CookieModel.extend({
	fetched: false,
	dCardColl: null,
	eventsMain: null,
	cookieKeys: [ "id", "dCard" ],
	defaults : {
		name: "J. Dancer",
		email: "",
		group: "",
		lastLogin: new Date().getTime(),
		password: "", //this is wiped out by the server when it returns an auth'd session
		memberStats: {},
		dCard: []
	},
	
	initialize : function( attrs, options ) {
		_.bindAll( this, "login", "signUp", "loginSuccess", "loginError", "loadDCard", "syncDCard" );
		if ( options )
			if ( options.dCard ) this.dCardColl = options.dCard;
			if ( options.events ) this.eventsMain = options.events;
		if ( this.readCookies() ) {
			this.anonDCard = this.get("dCard");
			if ( this.id )
				this.fetch( {success: this.login, error: this.loginError } );
			else
				// we're running anon....
				this.loadDCard();
		}
	},
	
	//TODO: put this in a friggin View where it belongs!!
	submitLogin : function ( form ) {
		if ( form ) this.set({ name: form.username.value, password: form.password.value });
		this.login();
		form.reset();
		location.href="#///!";
		return false;
	},		
	
	login : function() {
		$.couch.login( {name: this.get("name"), password: this.get("password"), success: this.loginSuccess, error: this.loginError } );
	},
	
	signUp : function() {
		$.couch.signup( this, this.get("password"), {success: this.loginSuccess, error: this.loginError} );
	},
	
	loginSuccess : function() {
		this.set( { password:"" } );
		alert("Success!  you're logged in" );
		// remove signup/login links
		// show logout link
		if ( this.anonDCard.length != 0 )
			this.set( {dCard: buDCard } )
		this.loadDCard();		
	},
	
	loginError : function(e){
		alert("Uh oh!! Error!\n" + e);
	},
	
	loadDCard : function() {
		if ( this.eventsMain && this.anonDCard.length > 0 )
			this.eventsMain.fetchAndSet( this.get( "dCard" ), {onDCard:true} );
		
		this.eventsMain.bind("change:onDCard", this.syncDCard );
	},
	
	syncDCard : function() {
		// hopefully, since this listener is attached after the EventColl's listener...
		//	...so that when we do get aroud to this, the dCard is updated
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

// A model that holds all of the current filtering/sorting state data
VU.FilterModel = Backbone.Model.extend({
	defaults : {
		tab: "dances",
		mapCoords: [0,0],
		genreTags: [""],
		danceCard: { selectedEvents: [] }
	}
});

// An entity that has events associated to it
VU.EventsContainerModel = Backbone.Model.extend({
	
	// load all events that have a band or hall (ofType) of this id
	//TODO: ofType needs to be more dependant on schema... we're currently assuming that the type is the same as the linkingRef
	loadEvents : function ( eventsCollection, ofType ) {
		this.set( {events: new VU.EventCollection( _.select( eventsCollection.models, function ( eventModel ) {
			return eventModel.get( ofType ) == this.id;
		}, this ) ) } );
	}
});

VU.LinkingModel = Backbone.Model.extend({
	linkRefs : {},
	initialize : function () {
		_.bindAll( this, "loadLinkRefs", "loadLinkVals" );
		this.bind ( "change", this.loadLinkRefs );
		
		// Loads all of the refs and values from schema for processing later
		// this.linkRefs is a dict where key is the linkref property name (i.e. band) and
		//	value is a dict where key is linkval property name (i.e. band name) and value
		//	is its cell lookup name (within the linkref)
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
	
	loadLinkRefs : function () {
		if ( ! (this.collection && this.collection.colls)) return;
		var attr, loadingQueue = {}, docID, coll, myRef;
		// load all referenced models so that we can pull data from them
		for ( attr in this.linkRefs )
		{
			// this attribute's value in the model is the doc ID of the link
			docID = this.get(attr);
			if ( docID )
			{
				if ( _.isArray(docID) && docID.length ) docID = docID[0];
				coll = this.collection.colls[ this.linkRefs[attr].coll ];
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
	
	initialize : function () { 
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
		var ed = this.get("stylesPlayed");
		if ( _.isArray(ed) ) ed = ed.join(", ") + ". ";
		
		this.set( {
			website: (this.get("website")||"").split("://").pop(),
			name: this.get("bandName"),
			entryDescription: ed,
			type: this.myType
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

	initialize : function () { 
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
			
		var ed = this.get("dateBuilt");
		if ( ed ) ed = "cir. " + ed + ". ";
		ed += this.get("historicalNarrative");
		
		this.set( { 
			thumbPic: hallPic,
			mainPic: hallPic.replace( "\/thumbs\/", "\/files\/" ), 
			website: (this.get("website")||"").split("://").pop(),
			name: this.get("danceHallName"),
			entryDescription: ed,
			type: this.myType
		}, { silent: true } );
	}
});

// Event model
VU.EventModel = VU.LinkingModel.extend({
	defaults : {
		hallPic: "images/genericHall.JPG",
		bandPic: "images/genericSilhouette.jpg",
		date: new Date().getTime(),
		time: "8:00 PM",
		onDCard: false // for local use, only
	},
	
	initialize: function () {
		_.bindAll( this, "normalizeDate" );
		this.bind( "change:date", this.normalizeDate );
		// date comes in at init, silently, so we'll normalize it now
		this.normalizeDate(); 
		VU.LinkingModel.prototype.initialize.call(this);
	},
	
	toggleDCard : function () {
		// no silent... we want listeners to pick it up
		var newDCard = !this.get("onDCard");
		this.set( { onDCard: newDCard } );
		return newDCard;
	},
	
	normalizeDate : function () {
		var myDateStr = this.get("date");
		var myDate = myDateStr instanceof Date ? myDateStr : new Date( myDateStr );
		if ( myDate.toString() == "Invalid Date" || ! myDate.getTime() ) {
			console.log( "Invalid date: " + (myDateStr == "" ? "(empty string)" : myDateStr) + ".  Using today's date." );
			myDate = new Date();
		} else {
			this.set({
				//TODO: make this a date util
				dateDay: ["SUN","MON","TUE","WED","THU","FRI","SAT"][myDate.getDay()],
				dateDate: myDate.getDate(),
				dateMonth: ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEPT","OCT","NOV","DEC"][myDate.getMonth()]
			}, {silent:true});
		}
	}
});

};