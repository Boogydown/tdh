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
/////////////////////////////////////////////////////////////////////////////
	// Band model
	var BandModel = Backbone.Model.extend({
		defaults : {
			"bandName" : "Generic Band",
			"image" : "http://images.woome.com/sitemedia/img/picGenericProfile.png",
			"bio" : "They play musical instruments."
		},
/*		url : function () { 
			return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id;
		}
*/	});

	// Vanue model
	var VenueModel = Backbone.Model.extend({
		defaults : {
			"danceHallName" : "Generic Hall",
			"images": [{"credit":"generic", "image":"http://malhotrarealestate.com/assets/images/generic_house_photo03.jpg"}],
			"description": "Has four walls and a roof."
		},
/*		url : function () { 
			return "https://dev.vyncup.t9productions.com:44384/tdh/" + this.id;
		}
*/	});

    // Event model
    var EventModel = Backbone.Model.extend({
        defaults : {
            "name": "Some generic event",
            "description": "Go here for fun!",
            "hall": "Generic Hall",
            "hallPic": "http://malhotrarealestate.com/assets/images/generic_house_photo03.jpg",
            "band": "Generic Band",
            "bandPic": "http://images.woome.com/sitemedia/img/picGenericProfile.png",
			"date": new Date().getTime(),
			"topY": 10
        },
		
		initialize: function () {
			_.bindAll( this, "loadRefs", "setHallLink", "setBandLink" );
			this.bind ( "change", this.loadRefs );
		},
		
		loadRefs: function () {
			this.loadRef( "band", Bands, this.setBandLink );
			this.loadRef( "hall", Halls, this.setHallLink );
		},
		
		loadRef: function( type, coll, callback ) {
			if ( this.get( type ).length > 0 ) {
				var myID = this.get( type )[0];
				var myRef = coll.get( myID );
				if ( ! myRef ){
					myRef = new coll.model( { id: myID });
					coll.add( myRef );
				}
				myRef.bind( "change", callback ); //TODO: facilitate more than one band
				myRef.fetch( { targetEvent:this } );
			}
			/*
			if ( this.get("band").length > 0 ) {
				var bandID = this.get("band")[0];
				var bandRef = Bands.get( bandID );
				if ( ! bandRef ){
					bandRef = new BandModel( { id: bandID });
					Bands.add( bandRef );
				}
				bandRef.bind( "change", this.setBandLink ); //TODO: facilitate more than one band
				//bandRef.fetch();
			}
			if ( this.get("hall").length > 0 ) {
				var hallID = this.get("hall")[0];
				var hallRef = Halls.get( hallID );
				if ( ! hallRef ){
					hallRef = new VenueModel( { id: hallID });
					Halls.add( hallRef );
				}
				hallRef.bind( "change", this.setHallLink ); //TODO: facilitate more than one band
				//hallRef.fetch();
			}*/
		},
		
		setBandLink: function ( targetBand, options ) {
			options.targetEvent.unbind("change", this.setBandLink );
			var bandID = targetBand.id;
			var bandPic = targetBand.get("image");
			if ( bandPic && bandPic.substr(0,4) != "http" )
				bandPic = "../../" + bandID + "/thumbs/" + encodeURI( bandPic );
			options.targetEvent.set( {"band": targetBand.get("bandName"), "bandPic": bandPic } );
		},
		
		setHallLink: function ( targetHall, options ) {
			options.targetEvent.unbind("change", this.setHallLink );
			var hallID = targetHall.id;
			var hallPic = targetHall.get("images")[0].image;
			if ( hallPic && hallPic.substr(0,4) != "http" )
				hallPic = "../../" + hallID + "/thumbs/" + encodeURI( hallPic );
				// TODO: check to see if this URL exists... ?  perhaps try <img src.... onerror=""/>
			options.targetEvent.set( {"hall": targetHall.get("danceHallName"), "hallPic": hallPic } );
		},
		
/*		toJSON : function() {
			//TODO: override to JSON to extract band and hall info
			if ( this.get("hall") ) 
			{
				
				this.set({"hall":
			}
		}*/
    });
	
/////////////////////////////////////////////////////////////////////////////
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
	var UpdateableCollection = Backbone.Collection.extend({
		update : function () {
			this.each( function (model) { model.fetch() } );
		}
	});
	
    // Now let's define a new Collection of Events
    var EventCollection = Backbone.Collection.extend({
        // The couchdb-connector is capable of mapping the url scheme
        // proposed by the authors of Backbone to documents in your database,
        // so that you don't have to change existing apps when you switch the sync-strategy
        url : "event",
        model : EventModel,
        // The events should be ordered by date
        comparator : function(event){
            return event.get("date");
        }
    });
	
	var BandCollection = UpdateableCollection.extend({
		url : "band",
		model : BandModel,
		comparator : function(band){
			return band.get("bandName");
		}
	});	
	
	var HallCollection = UpdateableCollection.extend({
		url : "dancehall",
		model : VenueModel,
		comparator : function(hall){
			return hall.get("danceHallName");
		}
	});

/////////////////////////////////////////////////////////////////////////////
/// VIEWS DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
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
            this.registerTemplate('mockupEventEntry'); // is the "this" valid for this func?  or does it need to be included in the _bindAll ?
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
		firstPass: true,
        initialize : function(){
            _.bindAll(this, 'render', 'addRow');
			
            this.collection.bind("refresh", this.render);
            this.collection.bind("add", this.addRow);
            this.collection.bind("remove", this.deleted);
        },

        render: function(){
            if(this.collection.length > 0){
                this.collection.each(this.addRow);
            }
			if ( this.firstPass ) {
				this.firstPass = false;
				this.trigger( "firstPassDone" );
			}
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
    
/////////////////////////////////////////////////////////////////////////////
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
    // The App controller initializes the app by calling `Comments.fetch()`
    var AppController = Backbone.Controller.extend({
        initialize : function(){
            Events.fetch();
				// init the Popup handler
	PopupHandler();
	

        }
    });

	var secondPassFetch = function() {
		//Halls.update();
		//Bands.update();
	}
/////////////////////////////////////////////////////////////////////////////
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
	// create our collection of event models
	var Events = new EventCollection();
	var Bands = new BandCollection();
	var Halls = new HallCollection();
	
	// create our main list view and attach the collection to it
	var MainListView = new EventListView({collection:Events});
	MainListView.bind( "firstPassDone", secondPassFetch );
	
	// when this inits, it should call Events.fetch(), which should in theory fetch all
	//	of its data; each model is updated and then triggers a change event which is bound to 
	//	the EventView.render call.  
	// When all data is replaced in the collection, the refresh event is triggered which 
	//	then kicks off the collection's render.
	// FIXME: this implies, then, that each Model is rendered twice...!?
	var App = new AppController();
});