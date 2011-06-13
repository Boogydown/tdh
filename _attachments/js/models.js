window.vu.models = {

/**
 * TODO:
 * 		Prototyping common/static methods
 */
	
/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	// A model that holds all of the current filtering/sorting state data
	FilterModel : Backbone.Model.extend({
		defaults : {
			tab: "dances",
			mapCoords: [0,0],
			genreTags: [""],
			danceCard: { selectedEvents: [] },
			
		},
	}),

	// An entity that has events associated to it
	EventsContainerModel : Backbone.Model.extend({
		myType : "",
		
		// load all events that have a band or hall (myType) of this id
		loadEvents : function ( eventsCollection ) {
			this.set( {events: new EventCollection( _.select( eventsCollection.models, function ( eventModel ) {
				return eventModel.get( this.myType ) == this.id;
			} ) ) } );
		},
	}),

	// Band model
	BandModel : EventsContainerModel.extend({
		defaults : {
			bandName: "Generic Band",
			image: "images/genericSilhouette.jpg",
			bio: "They play musical instruments.",
			genre: "N/A",
			events: null
		},
		
		initialize : function () { 
			this.myType = "band"; 
		},
		
		//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; },
		
		imageSearch: {}, 
		
		getGoogleImage : function () {
			this.imageSearch = new google.search.ImageSearch();
			this.imageSearch.setSearchCompleteCallback(this, this.searchComplete, null);
			this.imageSearch.execute(this.get( "bandName" ));
			//google.search.Search.getBranding('branding');
		},
		
		searchComplete : function() {
			if ( this.imageSearch.results && this.imageSearch.results.length > 0 )
			{
				var result = this.imageSearch.results[0];
				this.set( {image: result.tbUrl} );
				this.set( {mainPic: result.url} );
			}
		}
	}),

	// Venue model
	VenueModel : EventsContainerModel.extend({
		defaults : {
			danceHallName: "Generic Hall",
			images: [{"credit":"generic", "image":"images/genericHall.JPG"}],
			description: "Has four walls and a roof.",
			events: null
		},	

		initialize : function () { this.myType = "hall"; },
		//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; }
	}),

    // Event model
    EventModel : Backbone.Model.extend({
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
			_.bindAll( this, "loadRefs", "setBandLink", "setHallLink" );
			this.bind ( "change", this.loadRefs );
		},
		
		loadRefs: function () {
			// TODO: remove this unbind and just add a condition to skip this if (this.collection.fetching)
			//	(which is set to true at fetch, and false at refresh)
			this.unbind( "change", this.loadRefs );
			this.loadRef( "band", Bands, this.setBandLink );
			this.loadRef( "hall", Halls, this.setHallLink );
		},
		
		loadRef: function( type, coll, callback ) {
			if ( this.get( type ).length > 0 ) {
				var myID = this.get( type )[0];
				var myRef = coll.get( myID );
				var eventID = this.id;
				// if no band/hall created, yet, then make it
				if ( ! myRef ){
					myRef = new coll.model( { id: myID });
					coll.add( myRef );
					myRef.bind( "change", callback );
					myRef.fetch();
				// otherwise, load the old one
				} else {
					myRef.bind( "change", callback );
					// if already fetched then just pull the data
					if ( myRef.fetched !== undefined )
						callback( myRef, { "targetEventID":eventID });
				}	
			}
		},
		
		//TODO: consider making these methods belong to the actual Model for proper encapsulation
		setBandLink: function ( targetBand, options ) {
			//options.targetEvent.unbind("change", this.setBandLink );
			targetBand.fetched = true;
			var bandID = targetBand.id;
			var bandPic = targetBand.get("image");
			if ( bandPic && bandPic != targetBand.defaults.image && bandPic.substr(0, 4) != "http" )
				bandPic = "../../" + bandID + "/thumbs/" + encodeURI( bandPic );
			else
				targetBand.getGoogleImage();
			if ( ! targetBand.get( "mainPic" ) )
				targetBand.set( { mainPic: bandPic.replace( "\/thumbs\/", "\/files\/" ) }, { silent: true } );
			this.set( {"bandName": targetBand.get("bandName"), "bandPic": bandPic } );
		},
		
		setHallLink: function ( targetHall, options ) {
			//options.targetEvent.unbind("change", this.setHallLink );
			targetHall.fetched = true;
			var hallID = targetHall.id;
			var hallPic = targetHall.get("images")[0];
			if ( hallPic )
				hallPic = hallPic.image;
			else 
				hallPic = targetHall.defaults.images[0].image;
			if ( hallPic != targetHall.defaults.images[0].image )
				hallPic = "../../" + hallID + "/thumbs/" + encodeURI( hallPic );
				// TODO: check to see if this URL exists... ?  perhaps try <img src.... onerror=""/>
			targetHall.set( { mainPic: hallPic.replace( "\/thumbs\/", "\/files\/" ) }, { silent: true } );
			this.set( {"hallName": targetHall.get("danceHallName"), "hallPic": hallPic } );
		},
    })
};