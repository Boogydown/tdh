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
	//TODO: myType needs to be more dependant on schema
	loadEvents : function ( eventsCollection ) {
		this.set( {events: new VU.EventCollection( _.select( eventsCollection.models, function ( eventModel ) {
			return eventModel.get( this.myType ) == this.id;
		}, this ) ) } );
	},
});


VU.LinkingModel = Backbone.Model.extend({
	linkRefs : {},
	initialize : function () {
		_.bindAll( this, "loadLinkRefs", "loadLinkVals" );
		this.bind ( "change", this.loadLinkRefs );
		
		// Loads all of the refs and values from schema for processing later
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
				if ( docID.length ) docID = docID[0];
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
		this.trigger("change");
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
		if ( bandPic && bandPic != this.defaults.image && bandPic.substr(0, 4) != "http" ) {
			bandPic = "../../" + bandID + "/thumbs/" + encodeURI( bandPic );
			this.set( { 
				thumbPic: bandPic, 
				mainPic: bandPic.replace( "\/thumbs\/", "\/files\/" ),
				website: (this.get("website")||"").split("://").pop()
			}, { silent: true } );
		}
		else
			this.getGoogleImage();
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
		danceHallName: "Generic Hall",
		images: [{"credit":"generic", "image":"images/genericHall.JPG"}],
		description: "Has four walls and a roof.",
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
		this.set( { 
			thumbPic: hallPic,
			mainPic: hallPic.replace( "\/thumbs\/", "\/files\/" ), 
			website: (this.get("website")||"").split("://").pop()
		}, { silent: true } );
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
				dateDay: ["SUN","MON","TUE","WED","THU","FRI","SAT"][myDate.getDay()],
				dateDate: myDate.getDate(),
				dateMonth: ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEPT","OCT","NOV","DEC"][myDate.getMonth()]
			}, {silent:true});
		}
	}
});

};