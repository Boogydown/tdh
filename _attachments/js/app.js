$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "byType";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;

/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	// An entity that has events associated to it
	var EventsContainerModel = Backbone.Model.extend({
		myType : "",
		
		// load all events that have a band or hall (myType) of this id
		loadEvents : function ( eventsCollection ) {
			this.set( {events: new EventCollection( _.select( eventsCollection.models, function ( eventModel ) {
				return eventModel.get( this.myType ) == this.id;
			} ) ) } );
		},
	});

	// Band model
	var BandModel = EventsContainerModel.extend({
		defaults : {
			bandName: "Generic Band",
			image: "images/genericSilhouette.jpg",
			bio: "They play musical instruments.",
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
			imageSearch.execute(this.get( "bandName" ));
			//google.search.Search.getBranding('branding');
		},
		
		searchComplete : function() {
			if ( this.imageSearch.results && this.imageSearch.results.length > 0 )
				this.set( {image: this.imageSearch.results[0].tbUrl} );
		}
	});

	// Venue model
	var VenueModel = EventsContainerModel.extend({
		defaults : {
			danceHallName: "Generic Hall",
			images: [{"credit":"generic", "image":"images/genericHall.JPG"}],
			description: "Has four walls and a roof.",
			events: null
		},	

		initialize : function () { this.myType = "hall"; },
		//url : function () { return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id; }
	});

    // Event model
    var EventModel = Backbone.Model.extend({
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
			if ( bandPic && bandPic != targetBand.defaults.image )
				bandPic = "../../" + bandID + "/thumbs/" + encodeURI( bandPic );
			else
			{
				bandPic = targetBand.defaults.image;
				targetBand.getGoogleImage();
			}
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
    });
	
/////////////////////////////////////////////////////////////////////////////}
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // Now let's define a new Collection of Events
    var EventCollection = Backbone.Collection.extend({
        // The couchdb-connector is capable of mapping the url scheme
        // proposed by the authors of Backbone to documents in your database,
        // so that you don't have to change existing apps when you switch the sync-strategy
        url : "event",
        model : EventModel,
        // The events should be ordered by date
        comparator : function(event){
            return new Date( event.get("date") ).getTime();
        }
    });
	
	var BandCollection = Backbone.Collection.extend({
		url : "band",
		model : BandModel,
		comparator : function(band){
			return band.get("bandName");
		}
	});	
	
	var HallCollection = Backbone.Collection.extend({
		url : "dancehall",
		model : VenueModel,
		comparator : function(hall){
			return hall.get("danceHallName");
		}
	});

/////////////////////////////////////////////////////////////////////////////}
/// VIEWS DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	// This is the base class for any View using a dust template
    var DustView = Backbone.View.extend({		
        registerTemplate : function(name) {
            // Relies on inline templates on the page
            dust.compileFn( $('#'+name).html() , name);
            this.template = name;
        },
        
        getData : function(){
            return this.model.toJSON();
        },
        
        render : function(){ 
            var result = '';
            dust.render(this.template, this.getData(), function (err,out) {
                if (err) result = err;
                else result = out;
            } );
            $(this.el).html(result);
            return this;
        }
    });

    // Represents an event entry in an event listing; is a dust template
    var EventEntryView = DustView.extend({

        // Clicking the feet adds it to the dance card
        events : {
            "click .feet" : "addToDanceCard",
        },
        
        // If there's a change in our model, rerender it
        initialize : function(){
            _.bindAll(this, 'render', "addToDanceCard");
            this.model.bind('change', this.render);
            this.registerTemplate('mainEventEntryTemplate');
        },
        
        // Adds this event to the danceCard collection
        addToDanceCard : function(){
			// nothing here, yet
        }
    });	

	// The view for the primary event list container
    var EventListView = Backbone.View.extend({
        el: $("#list"),
		nextY: 10,
		curDate: null,
        initialize : function(){
            _.bindAll(this, 'render', 'addRow');
            this.collection.bind("refresh", this.render);
            this.collection.bind("add", this.addRow);
            this.collection.bind("remove", this.deleted);
        },

        render: function(){
            if(this.collection.length > 0) this.collection.each(this.addRow);
        },
        
        // Appends an entry row 
        addRow : function(model){
			model.set( { "topY" : String(this.nextY) } );
			if ( model.get( "date" ) == this.curDate )
			{
				model.set( { "date" : "" } );
				this.nextY += 82;
			}
			else
			{
				this.curDate = model.get( "date" );
				this.nextY += 105;
			}
            var view = new EventEntryView( { model: model } );
            this.el.append( view.render().el );
        }
    });
	
	//var PopupView = DustView.extend({
	
	BandView = DustView.extend({
		el : $("#popup_block"), 
        initialize : function(){
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            this.registerTemplate( "bandPopupTemplate" ); 
			//this.bandEventsView = new EventListView( { 
        },	
	});

	HallView = DustView.extend({
		el : $("#popup_block"), 
        initialize : function(){
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            this.registerTemplate( "hallPopupTemplate" ); 
			//this.bandEventsView = new EventListView( { 
        },	
	});
    
/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var AppController = Backbone.Controller.extend({
        initialize : function(){
			// kick off the initial fetch
            Events.fetch();

			// init the Popup handler to attach to the existing pics
			window.utils.popupInit( this );
        }
    });

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	// create our collection of event models
	Events = new EventCollection();
	Bands = new BandCollection();
	Halls = new HallCollection();
	
	// create our main list view and attach the collection to it
	var mainListView = new EventListView({collection:Events});
	
	// when this inits, it should call Events.fetch(), which should in theory fetch all
	//	of its data; each model is updated and then triggers a change event which is bound to 
	//	the EventView.render call.  
	// When all data is replaced in the collection, the refresh event is triggered which 
	//	then kicks off the collection's render.
	// FIXME: this implies, then, that each Model is rendered twice...!?
	var App = new AppController();

});
/////////////////////////////////////////////////////////////////////////////}

