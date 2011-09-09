VU.InitModels = function () {
/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
// Holds info about the current user and their session (persisted to browser cookie)
VU.CookieModel = Backbone.Model.extend({
	writeCookie : function() {
	},
	
	readCookie : function() {
	}	
});

VU.AuthSessionModel = VU.CookieModel.extend({
	// default timeout is 10 minutes
	DEFAULTTIMEOUT : 10 * 60 * 1000,
	
	defaults : {
		username: "anonymous",
		authToken: "",
		permissions: {},
		fetched: false,
		//TODO: will need to somehow update this timeout on every user or HTTP action
		timeout: new Date().getTime() + this.DEFAULTTIMEOUT
	},
	
	load : function( completeCallback ) {
		var sessionID = window.utils.readCookie( "tdh_sessionID", ";" );
		if ( sessionID ) {
			// if cookie exists then there is an active session; 
			//	create session model and retrieve it from the db
			this.id = sessionID;
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
		if ( ! this.collection.colls ) return;
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
		this.bind( "change", this.normalizeAttributes );		
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
		this.bind( "change", this.normalizeAttributes );		
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
		time: "8:00 PM"
	},
	
	initialize: function () {
		_.bindAll( this, "normalizeDate" );
		this.bind( "change", this.normalizeDate );
		VU.LinkingModel.prototype.initialize.call(this);
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