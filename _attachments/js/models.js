VU.InitModels = function () {
/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
// A model that holds all of the current filtering/sorting state data
VU.FilterModel = Backbone.Model.extend({
	defaults : {
		tab: "dances",
		mapCoords: [0,0],
		genreTags: [""],
		danceCard: { selectedEvents: [] },
		
	},
});

// An entity that has events associated to it
VU.EventsContainerModel = Backbone.Model.extend({
	myType : "",
	
	// load all events that have a band or hall (myType) of this id
	loadEvents : function ( eventsCollection ) {
		this.set( {events: new EventCollection( _.select( eventsCollection.models, function ( eventModel ) {
			return eventModel.get( this.myType ) == this.id;
		} ) ) } );
	},
});


VU.LinkingModel = Backbone.Model.extend({
	linkRefs : {},
	linkRefsCount : 0,
	linkVals : {},
	initialize : function () {
		_.bindAll( this, "loadLinkRefs", "loadLinkVals" );
		this.bind ( "change", this.loadLinkRefs );
		// Loads all of the refs and values from schema for processing later
		var fields = this.options && this.options.schema && this.options.schema.properties || 
					 this.collection.schema && this.collection.schema.properties ||
					 {};
		for ( var attr in fields )
		{
			if ( fields[attr].linkRef !== undefined )
				this.linkRefs[attr] = fields[attr].linkRef;
			if ( fields[attr].linkVal !== undefined )
				this.linkVals[attr] = fields[attr].linkVal;
		}
	},
	
	loadLinkRefs : function () {
		this.unbind( "change", this.loadLinkRefs );
		var attr, loadingQueue = {}, docID, coll, myRef, that = this;
		// we're doing two passes: first to tally valid refs, 2nd to load them
		// this'll prevent race conditions when dealing with linkRefsCount
		for ( attr in this.linkRefs )
		{
			// this attribute's value in the model is the doc ID of the link
			docID = this.get(attr);
			if ( docID )
			{
				if ( docID.length ) docID = docID[0];
				coll = this.collection.colls[ this.linkRefs[attr] ];
				if ( coll )
				{
					loadingQueue[attr] = {docID:docID, coll:coll};
					this.linkRefsCount++;
				}
			}
		}
		// 2nd pass to load them
		for ( attr in loadingQueue )
		{	
			//TODO: great opportunity to bulk load, here
			myRef = loadingQueue[attr].coll.get( loadingQueue[attr].docID );
			// if reference not loaded yet, then create and fetch it
			if ( ! myRef ) {
				var coll = loadingQueue[attr].coll;
				myRef = new coll.model( { 
					id:loadingQueue[attr].docID, 
					events:{"change": that.loadLinkVals} 
				} );
				coll.add( myRef );
				myRef.fetch( {attr:attr} );
			}
			// otherwise, load the old one
			else {
				myRef.bind( "change", this.loadLinkVals );
				// if already fetched then just pull the data
				if ( myRef.fetched !== undefined )
					this.loadLinkVals( myRef, {attr:attr} );
			}
		}
	},
	
	loadLinkVals : function ( myRef, options ) {
		myRef.fetched = true;
		this.linkRefs[ options.attr ] = myRef;

		// if gets down to zero then all models are loaded and stored in this.linkRefs and are ready to set the linked values
		if ( ! --this.linkRefsCount )
		{
			var srcAttr, linkRef, destAttr;
			for ( destAttr in this.linkVals )
			{
				srcAttr = {}; 
				linkRef = this.linkRefs[ this.linkVals[destAttr].linkRef ];
				if ( linkRef )
				{
					// necessary trick to allow for variable key
					srcAttr[destAttr] = linkRef.get( this.linkVals[destAttr].cell );
					this.set( srcAttr, {silent:true} ); //postpone change trigger til after all vals set
				}
			}
			this.trigger("change");
		}
	},	
});


// Band model
VU.BandModel = VU.EventsContainerModel.extend({
	defaults : {
		bandName: "Generic Band",
		image: "images/genericSilhouette.jpg",
		bio: "They play musical instruments.",
		events: null
	},
	
	initialize : function () { 
		this.myType = "band"; 
		_.bindAll( this, "normalizeImages", "normalizeWebpage" );
		this.bind( "change:images", this.normalizeImages );		
		this.bind( "change:webpage", this.normalizeWebpage );
	},
	
	//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; },

	normalizeImage : function () {
		var bandID = this.id;
		var bandPic = this.get("image");
		if ( bandPic && bandPic != this.defaults.image && bandPic.substr(0, 4) != "http" ) {
			bandPic = "../../" + bandID + "/thumbs/" + encodeURI( bandPic );
			this.set( { 
				thumbPic: bandPic, 
				mainPic: bandPic.replace( "\/thumbs\/", "\/files\/" ) 
			}, { silent: true } );
		}
		else
			this.getGoogleImage();
	},
	
	normalizeWebpage : function() {
		this.set({ website: this.get("website").split("://").pop() });
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
			this.set( {thumbPic: result.tbUrl} );
			this.set( {mainPic: result.url} );
		}
	}
});

// Venue model
VU.VenueModel = VU.EventsContainerModel.extend({
	defaults : {
		danceHallName: "Generic Hall",
		images: [{"credit":"generic", "image":"images/genericHall.JPG"}],
		description: "Has four walls and a roof.",
		events: null
	},	

	initialize : function () { 
		this.myType = "hall"; 
		_.bindAll( this, "normalizeImages", "normalizeWebpage" );
		this.bind( "change:images", this.normalizeImages );		
		this.bind( "change:webpage", this.normalizeWebpage );
	},
	
	//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; }
	
	normalizeImages : function () {
		var hallID = this.id;
		var hallPic = this.get("images")[0];
		if ( hallPic )
			hallPic = hallPic.image;
		else 
			hallPic = this.defaults.images[0].image;
		if ( hallPic != this.defaults.images[0].image )
			hallPic = "../../" + hallID + "/thumbs/" + encodeURI( hallPic );
			// TODO: check to see if this URL exists... ?  perhaps try <img src.... onerror=""/>
		this.set( { 
			thumbPic: hallPic,
			mainPic: hallPic.replace( "\/thumbs\/", "\/files\/" ) 
		}, { silent: true } );
	},
	
	normalizeWebpage : function() {
		this.set({ website: this.get("website").split("://").pop() }, {silent:true});
	},
	
});

// Event model
VU.EventModel = VU.LinkingModel.extend({
	defaults : {
		name: "Some generic event",
		description: "Go here for fun!",
		hall: "dancehall0",
		hallName: "Generic Hall",
		hallPic: "images/genericHall.JPG",
		band: "band0",
		bandName: "Generic Band",
		bandPic: "images/genericSilhouette.jpg",
		date: new Date().getTime(),
		topY: 10
	},
	
	initialize: function () {
		_.bindAll( this, "normalizeDate" );
		this.bind( "added", this.normalizeDate );
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
				dateDay: ["SUN","MON","TUE","WED","THU","FRI","SAT"][myDate.getDay()],
				dateDate: myDate.getDate(),
				dateMonth: ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEPT","OCT","NOV","DEC"][myDate.getMonth()]
			}, {silent:true});
		}
	}
});

};