VU.InitModels = function () {
/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{

VU.MailerModel = Backbone.Model.extend({
	databaseName : "mailspool",
	url: "mailspool",
	fetched : false,
	defaults: {
		date: {
			sent: null,
			created: new Date().toString()
		},
		message: "",
		msgformat: "text/plain",
		note: [],
		notes: "Notes",
		priority: null,
		recipients: {
			to: {},
			cc: {},
			bcc: {}
		},
		sender: {
			"VyncUp Bot": "VyncUp@gmail.com"
		},
		state: "unsent",
		subject: "Vync-Up message"
	}
});

/**
 * A Model that persists any keys stored in this.cookieKeys to the document cookies
 */
VU.CookieModel = Backbone.Model.extend({
	prefix : "vu_",
	
	initialize : function() {
		_.bindAll( this, "setDirty" );
		this.isDirty = false;
		this.bind( "change", this.setDirty );
	},
	
	/**
	 * isDirty since the last writeCookies?
	 */
	setDirty : function() {
		this.isDirty = true;
	},
	
	/**
	 * A utility to detect if 3rd party cookies are enabled
	 **/
	checkCookies : function(){
		this.createCookie( "__checkCookie", "testing3rdPartyCookies", 1 );
		var result = this.readCookie( "__checkCookie" );
		this.eraseCookie( "__checkCookie ");
		return result == "testing3rdPartyCookies";
	},

	/**
	 * Will write only model values that are in this.cookieKeys array
	 */
	writeCookies : function() {
		if ( !this.isDirty ) return;
		this.isDirty = false;
		var i, key, val;
		for ( i in this.cookieKeys ){
			key = this.cookieKeys[i];
			val = this.get( key );
			if ( val !== undefined ){
				this.createCookie( key, val, 10 );
			}
		}
		if ( this.id ) this.save();
	},

	/**
	 * Read previously-saved values from the cookies, if exist
	 */
	readCookies : function() {
		var i, key, val;
		var data = {};
		for ( i in this.cookieKeys ){
			key = this.cookieKeys[i];
			val = this.readCookie( key );
			if ( val !== "" )
				data[ key ] = val;
			else
				return false;
		}
		this.set( data );
		return true;
	},

	//============================================================
	/**
	 * Ganked from here: http://www.quirksmode.org/js/cookies.html
	 **/
	createCookie : function( name, value, days ) {
		if ( days ) {
			var date = new Date();
			date.setTime( date.getTime() + (days * 24 * 60 * 60 * 1000) );
			var expires = "; expires=" + date.toGMTString();
		}
		else 
			var expires = "";
		document.cookie = name + "=" + JSON.stringify(value) + expires + "; path=/";
	},

	readCookie : function (name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		var value = "";
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') 
				c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) 
				value = c.substring(nameEQ.length,c.length);
		}
		try {
			if ( value )
				value = JSON.parse( value );
		} catch (e) {}
		return value;
	},

	eraseCookie : function(name) {
		this.createCookie(name,"",-1);
	},
	//============================================================

});

/**
 * Contains current user info and auth stuff **Only one instance**
 */
VU.MemberModel = VU.CookieModel.extend({
	databaseName : "_users",
	url: "_users",
	fetched : false,
	cookieKeys : [ "dCard", "test" ],
	ID_PREFIX: "org.couchdb.user:",
	isAdmin: false,
	defaults : {
		realName: "",
		name: "",
		group: "",
		lastLogin: new Date().getTime(),
		dateCreated: new Date().getTime(),
		memberStatus: "unpaid",
		image: "/tdh/_design/tdh_public/images/genericSilhouette.jpg",
		dCard: [],
		roles: ["tdhp_user"],
		owns: { events:[], vyntors:[] },
		type: "user",
		loggedIn: false
	},
	
	initialize : function( attrs, options ) {
		// if this is being created from the coll fetch then skip login stuf
		if ( !this.isNew() ) return;
		
		VU.CookieModel.prototype.initialize.call( this, attrs, options );
		_.bindAll( this, "_userFetched", "doLogin", "doSignup", "_syncDCard", "loadDCard" );
		
		options || (options = {});
		this.dCardColl = options.dCard;
		this.eventsMain = options.events;
		this.doneCallback = options.doneCallback || function(){};
		
		if ( this.readCookies() ) {
			// any cookies loaded?  dcard?
			this.cookieDCard = this.get("dCard");
		}
		
		this._setLogin();
	},

	/**
	 * doLogin and doSignup pulled from Futon v0.11.0 ////////////////////////////
	 */
    doLogin : function(name, password, callback) {
		var model = this;
		$.couch.login({
			name : name,
			password : password,
			success : function() {
				model._setLogin();
				callback();
			},
			error : function(code, error, reason) {
				//this.processError( code, error, reason );
				callback({name : "Error logging in: "+reason});
			}
		});
    },
    
	/**
	 * doLogin and doSignup pulled from Futon v0.11.0 ////////////////////////////
	 */
    doSignup : function(name, password, callback) {
		var model = this;
		$.couch.signup({
			name : name
		}, password, {
			success : function() {
				new VU.MailerModel({
					recipients: {
						"to": {"TDHP Admin": "admin@texasdancehall.org"},
						"cc": {"Dimitri": "dimitri@vyncup.com"},
						"bcc": {}
					},
					"subject": "User Added: " + name,
					"message": "User added!\nName: " + name
				}).save();
				model.doLogin(name, password, callback);            
			},
			error : function(status, error, reason) {
				if (error == "conflict") {
					callback({name : "Name '" + name + "' is taken"});
				} else {
					callback({name : "Signup error:  " + reason});
				}
			}
		});
    },
	//////////////////////////////////////////////////////////////////////////////	
	
	doUpdate : function ( data, callback ) {
		// we don't want to overwrite attachments; we got appropriate attachments sig
		//	in the fetch() call at the end of addAttachments
		delete data._attachments;
		this.save( data,{ 
			success: function() {callback();},
			error: function (model, resp, options) {callback({submit:"Error saving: " + resp});}
		});
		return false;
	},

	logout : function() {
		this.clear( {silent:true} );
		this.set( this.defaults );
		this.isAdmin = false;
		this.writeCookies();
		$.couch.logout();
	},
	
	/**
	 * for anonymous sessions
	 */
	prepAnon : function() {
		utils.logger.log( "Setting up an anonymous session." );
		this.clear({silent:true});
		this.set( this.defaults );
		this.loadDCard();
		// save, in case the dCard was from cookie or user
		this.doneCallback();
	},

	/**
	 * Last stop for logging in; called during login, login via signup, or page load
	 * 	at this point, we have nothing in the model, yet
	 */
	_setLogin : function() {
		var model = this; 
		$.couch.session({
			success : function(resp) {
				if ( resp.userCtx && resp.userCtx.name ) {
					model.set( { id: model.ID_PREFIX + resp.userCtx.name }, {silent:true} );
					model.fetch( {success: model._userFetched} );
				} else {
					model.prepAnon();
				}
			}
		});
		return false;
	},
	
	_userFetched : function() {
		this.set( { loggedIn: true, lastLogin: new Date().getTime() } );
		this.isAdmin = _(this.get("roles")).indexOf("admin") > -1;
		this.loadDCard();
		this.doneCallback();
	},

	/**
	 * Load dance card events from saved session OR cookies
	 *
	 * @param (string) dCard A &-delimited list of events to add to the card; if not given then use the events saved in the cookies
	 */
	loadDCard : function( dCard ) {
		if ( dCard && _.isString(dCard) ) this.cookieDCard = dCard.split("&");
		
		//intended to break until the events are loaded, then we can continue to set them
		if ( !this.eventsMain ) return;
		if ( this.eventsMain.fetched ) {
			
			// once events are fetched then we set the dCard for all matching ids in the dCard array
			this.eventsMain.unbind( "reset", this.loadDCard );
			
			// cookie dCard takes precedence over logged-in one
			if ( this.cookieDCard && this.cookieDCard.length > 0 ) {
				this.set( {dCard: this.cookieDCard } )
				this.cookieDCard = null;
			}
			var dCard = this.get( "dCard" ), events = this.eventsMain, event;
			if ( dCard && dCard.length > 0 ) {
				_.each( dCard, function (eventId) {
					event = events.get( eventId );
					// if an event on the DCard has already passed then it will be null
					if (event) event.set( {onDCard: true} );
				});
			}
			
			// now, so that we can make dCardColl alive earlier, before the DCard tab is opened:
			this.dCardColl.applyFilters( [{key:"onDCard", start:"true", end:"true"}] );
			
			// to keep us in sync as things are added
			this.dCardColl.bind( "add", this._syncDCard );
			this.dCardColl.bind( "remove", this._syncDCard );
			
			this.writeCookies();
		}
		else
			this.eventsMain.bind( "reset", this.loadDCard );
	},
	
	_syncDCard : function() {
		this.set( {dCard: this.dCardColl.pluck( "id" )} );
		this.writeCookies();
	}
});

/**
 * A Model that can be "owned" by a user
 */
VU.OwnableModel = Backbone.Model.extend({
	otype: "vyntors",
	
	/**
	 * All subclasses should override this to provide their own
	 * 	caption that shows up in the mini list on your user profile
	 *	with the stuff you own
	 */
	getOwnerCaption : function() {
		//stub: should be overridden
	},
	
	updateOwners : function ( prev )
	{
		return;
		var model = this,
			//prev = isNew ? [] : model.previous("ownerUsers"),  for some reason, previous is not always giving previous value, but current value... which is useless
			val = model.get("ownerUsers"),
			added = _(_.difference(val,prev)),
			removed = _(_.difference(prev,val)),
			loaded = {},
			addFunc = function(userModel){
				var owns = userModel.get("owns");
				owns[model.otype].push({
					id: model.id,
					type: model.myType,
					caption: model.getOwnerCaption()
				});
				//userModel.save();
			},
			delFunc = function(userModel){
				var owns = userModel.get("owns");
				owns[model.otype] = _(owns[model.otype]).reject(function(m){return m.id==model.id;});
				//userModel.save();
			},
			getting = function(mID, action){
				if ( mID in loaded )
					action(loaded[mID]);
				else
					(loaded[mID] = new VU.MemberModel({id:mID})).fetch({
						success: function(m){action(m);}
					});
			};
			
		// our current user is loaded, so add it to loaded list for quick reference
		loaded[app.mySession.id] = app.mySession;
		added.each( function(m){ getting(m, addFunc); } );
		removed.each( function(m){ getting(m, delFunc); });
		
		// save only after all of it
		for ( var u in loaded )
			loaded[u].save();
	},
	
	destroy : function(options) {
		var prev = this.get("ownerUsers");
		this.set({ownerUsers:[]}, {silent:true});
		this.updateOwners(prev);
		Backbone.Model.prototype.destroy.call(this, options);
	}		
});	
	
/**
 * An entity that has events associated with it
 */
VU.EventsContainerModel = VU.OwnableModel.extend({
	initialize : function( ) {
		_.bindAll( this, "loadEvents" );
	},
	
	/**
	 * load all events that have a band or hall (ofType) of this id
	 * TODO: ofType needs to be more dependant on schema... we're currently assuming that the type is the same as the linkingRef
	 *
	 * @param (EventsCollection) eventsCollection Reference to the current events collection
	 */
	loadEvents : function ( eventsCollection ) {
		var myEvents = new VU.LocalFilteredCollection( null, {collection: eventsCollection, name:this.name } ),
			myId = this.id, 
			ofType = this.myType;
		myEvents.applyFilters( [{key: ofType, start: myId, end: myId}] );
		this.set( {events: myEvents} );
	}
});

/**
 * A model with attributes that link to other models
 */
VU.LinkingModel = VU.OwnableModel.extend({
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
					 this.collection && this.collection.schema && this.collection.schema.properties ||
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
	
	/**
	 * Loads all of the references (other, linked docs that we're pulling info
	 *	from) and stores them in a hash table for later lookup
	 */
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
	
	/**
	 * Load the actual values from those references loaded in loadLinkRefs
	 */
	loadLinkVals : function ( myRef ) {
		if ( !myRef )
			utils.logger.log("myRef undefined");
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

/**
 * Band model
 */
VU.BandModel = VU.EventsContainerModel.extend({
	myType : "band",
	defaults : {
		bandName: "Loading...",
		image: "http://dev.vyncup.t9productions.com:44384/tdh/_design/tdh_public/images/loader-spinner-big.gif",
		ownerUsers: [],
		stylesPlayed: [],
		hallsPlayed: [],
		events: null,
		status: "Active",
		dateCreated: new Date().toString()
	},
	
	initialize : function ( attrs, options ) { 
		VU.EventsContainerModel.prototype.initialize.call( this, attrs, options );
		this.name = _.uniqueId( "band" );
		this.throttledGetGoogleImage = _.throttle( this.getGoogleImage, 100 );
		this.throttledSetVisible = _.throttle( this.setVisible, 50 );
		_.bindAll( this, "normalizeAttributes", "searchComplete", "setVisible" );
		//this.bind( "change:image", this.normalizeAttributes );		
		//this.bind( "change:stylesPlayed", this.normalizeAttributes );		
		//this.bind( "change:website", this.normalizeAttributes );		
		//this.bind( "change:bandName", this.normalizeAttributes );		
		//this.bind( "change:ownerUsers", this.normalizeAttributes );		
		this.bind("change", this.normalizeAttributes );
		// kick it off once for those that came in at init
		this.normalizeAttributes( this, "", {} );
	},
	
	getOwnerCaption : function() {
		return this.get("bandName");
	},
	
	isLoaded : function() {
		return this.get("bandName") != this.defaults.bandName;
	},
	
	//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; },

	/**
	 * Used to normalizing different data in the doc in prep for displaying
	 * 	and usage elsewhere, such as filtering
	 */
	normalizeAttributes : function ( model, val, options ) {
		if ( !this.isLoaded() || ( options && options.skipNormalize ) ) return;
		
		var bandID = this.id;
		var image = this.get("image");
		var entryDescription = this.get("stylesPlayed");
		if ( _.isArray(entryDescription) ) entryDescription = entryDescription.join(", ") + ". ";
		
		var ownerUsers = this.get("ownerUsers");
		for ( var i in ownerUsers ) {
			var user = ownerUsers[i];
			if ( !(user in app.ownerUsers ))
				app.ownerUsers[user] = {events:{},vyntors:{}}
			app.ownerUsers[user].vyntors[this.id] = this;
		}		
		
		this.set( {
			website: utils.formatURL(this.get("website")),
			name: this.get("bandName"),
			entryDescription: entryDescription
		}, { silent: true } );
		
		if ( image && image != this.defaults.image ) {
			if (  image[0] != "." && image[0] != '/' && image.substr(0, 4) != "http" ) {
				image = "../../" + bandID + "/" + encodeURI( image );
				this.set( { image: image }, { silent: true } );
			}
			this.cachedThumb = this.get("thumbPic") || image;
			//this.throttledSetVisible();
		}
		else
			if ( window.google ) this.throttledGetGoogleImage();
	},
	
	imageSearch: {},
	
	setVisible: function() {
		if ( this.cachedThumb ) {
			this.set( {thumbThrottled: this.cachedThumb }, { skipNormalize: true } );
			this.cachedThumb = null;
		}
	},
	
	getGoogleImage : function () {
		try {
			this.imageSearch = new google.search.ImageSearch();
			this.imageSearch.setSearchCompleteCallback(this, this.searchComplete, null);
			this.imageSearch.execute(this.get( "bandName" ) + " band");
			//google.search.Search.getBranding('branding');
		}
		catch (e) {utils.logger.log("Cannot load Google Images API: " + e);}
	},
	
	searchComplete : function() {
		if ( this.imageSearch.results && this.imageSearch.results.length > 0 ) {
			var result = this.imageSearch.results[0];
			var image = this.get("image");
			if ( result ) {
				utils.logger.log( "Google image search found images for " + this.get("bandName") + " (" + this.id + "): " + result.url );
				this.set({
					thumbPic: result.tbUrl,
					thumbThrottled: result.tbUrl,
					image: result.url
				}, {
					skipNormalize: true
				});
			}
		}
	}
});

/**
 * Venue model
 */
VU.VenueModel = VU.EventsContainerModel.extend({
	myType : "hall",
	defaults : {
		images: [{"credit":"generic", "image":"images/genericHall.JPG"}],
		danceHallName: "Loading...",
		documents: [],
		events: null,
		ownerUsers: []
	},	

	initialize : function ( attrs, options ) { 
		VU.EventsContainerModel.prototype.initialize.call( this, attrs, options );
		this.name = _.uniqueId( "hall" );
		this.throttledSetVisible = _.throttle( this.setVisible, 50 );
		_.bindAll( this, "normalizeAttributes", "setVisible" );
		//this.bind( "change:images", this.normalizeAttributes );		
		//this.bind( "change:dateBuilt", this.normalizeAttributes );		
		//this.bind( "change:historicalNarrative", this.normalizeAttributes );		
		//this.bind( "change:website", this.normalizeAttributes );		
		//this.bind( "change:danceHallName", this.normalizeAttributes );		
		//this.bind( "change:ownerUsers", this.normalizeAttributes );		
		this.bind( "change", this.normalizeAttributes );
		// kick it off once for those that came in at init
		this.normalizeAttributes();
	},
	
	getOwnerCaption : function() {
		return this.get("danceHallName");
	},	
	
	isLoaded : function() {
		return this.get("danceHallName") != this.defaults.danceHallName;
	},
	
	//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; }
	
	/**
	 * Used to normalizing different data in the doc in prep for displaying
	 * 	and usage elsewhere, such as filtering
	 */
	normalizeAttributes : function () {
		if ( ! this.isLoaded() ) 
			return;
		
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
			
		var ownerUsers = this.get("ownerUsers");
		for ( var i in ownerUsers ) {
			var user = ownerUsers[i];
			if ( !(user in app.ownerUsers ))
				app.ownerUsers[user] = {events:{},vyntors:{}}
			app.ownerUsers[user].vyntors[this.id] = this;
		}
			
		var entryDescription = "", str = this.get("dateBuilt");
		if ( str ) 
			entryDescription = "cir. " + str + ". ";
		if ( str = this.get("county") )
			entryDescription += str + " county. ";
		if ( str = this.get("historicalNarrative") )
			entryDescription += str;
		
		var gps = this.get( "GPS Coordinates" ) || this.get( "gpsCoordinates" );
		gps = utils.parseGPS( gps );
		
		this.set( { 
			thumbPic: hallPic,
			mainPic: hallPic.replace( "\/thumbs\/", "\/files\/" ), 
			website: utils.formatURL(this.get("website")),
			name: this.get("danceHallName"),
			entryDescription: entryDescription,
			lat: gps.lat,
			lng: gps.lng
		}, { silent: true } );
		
		this.cachedThumb = this.get("thumbPic");
		//this.throttledSetVisible();
	},
	
	setVisible: function() {
		if ( this.cachedThumb ) {
			this.set( {thumbThrottled: this.cachedThumb }, { skipNormalize: true } );
			this.cachedThumb = null;
		}
	}
	
});

/**
 * Event model
 */
VU.EventModel = VU.LinkingModel.extend({
	myType: "event",
	otype: "events",
	defaults : {
		featured: false,
		onDCard: false, // for local use, only
		ownerUsers: []
	},
	
	initialize: function ( attrs, options ) {
		this.name = _.uniqueId( "event" );
		_.bindAll( this, "normalizeData" );
		//this.bind( "change:date", this.normalizeData );
		//this.bind( "change:hall", this.normalizeData );
		//this.bind( "change:date", this.normalizeData );
		//this.bind( "change:gpsCoordinates", this.normalizeData );
		//this.bind( "change:ownerUsers", this.normalizeData );
		this.bind( "change", this.normalizeData );
		// date comes in at init, silently, so we'll normalize it now
		VU.LinkingModel.prototype.initialize.call(this, attrs, options);
		this.normalizeData(); 
	},
	
	getOwnerCaption : function() {
		return (this.get("eventType") || "An") + " event on " + this.get("date"); 
	},

	toggleDCard : function () {
		// no silent... we want listeners to pick it up
		var newDCard = !this.get("onDCard");
		this.set( { onDCard: newDCard } );
		return newDCard;
	},
	
	/**
	 * Used to normalizing different data in the doc in prep for displaying
	 * 	and usage elsewhere, such as filtering
	 */
	normalizeData : function () {
		var myDateStr = this.get("date");
		var myDate = myDateStr instanceof Date ? myDateStr : new Date( myDateStr );
		if ( myDate.toString() == "Invalid Date" || ! myDate.getTime() ) {
			utils.logger.log( "Invalid date: " + (myDateStr == "" ? "(empty string)" : myDateStr) + ".  Using today's date." );
			myDate = new Date();
		}

		var ownerUsers = this.get("ownerUsers");
		for ( var i in ownerUsers ) {
			var user = ownerUsers[i];
			if ( !(user in app.ownerUsers ))
				app.ownerUsers[user] = {events:{},vyntors:{}}
			app.ownerUsers[user].events[this.id] = this;
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

/**
 * Model that facilitates easy accessing and parsing of filter data as retrieved from the URL hash
 */
VU.FilterModel = Backbone.Model.extend({
	
});
};