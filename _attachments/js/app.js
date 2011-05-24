$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "events";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;

/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
	// Band model
	var BandModel = Backbone.Model.extend({
		defaults : {
			"name" : "Generic Band",
			"picURL" : "http://images.woome.com/sitemedia/img/picGenericProfile.png",
			"bio" : "They play musical instruments."
		}
	});

	// Vanue model
	var VenueModel = Backbone.Model.extend({
		defaults : {
			"name" : "Generic Hall",
			"picURL": "http://malhotrarealestate.com/assets/images/generic_house_photo03.jpg",
			"bio": "Has four walls and a roof."
		}
	});

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
        el: $("#mockup_div"),
		nextY: 10,
		curDate: null,
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
        },
        
        // Appends an entry row 
        addRow : function(model){
			model.set( { "topY" : String(this.nextY) } );
			if ( model.get( "date" ) == this.curDate )
				model.set( { "date" : "" } );
			else
				this.curDate = model.get( "date" );
            var view = new EventEntryView( { model: model } );
            this.el.append( view.render().el );
			this.nextY += 105;
        }
    });
    
/////////////////////////////////////////////////////////////////////////////
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
    // The App controller initializes the app by calling `Comments.fetch()`
    var AppController = Backbone.Controller.extend({
        initialize : function(){
            Events.fetch();
        }
    });

/////////////////////////////////////////////////////////////////////////////
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
	// create our collection of event models
	var Events = new EventCollection();
	
	// create our main list view and attach the collection to it
	var MainListView = new EventListView({collection:Events});
	
	// when this inits, it should call Events.fetch(), which should in theory fetch all
	//	of its data; each model is updated and then triggers a change event which is bound to 
	//	the EventView.render call.  
	// When all data is replaced in the collection, the refresh event is triggered which 
	//	then kicks off the collection's render.
	// FIXME: this implies, then, that each Model is rendered twice...!?
	var App = new AppController();
});