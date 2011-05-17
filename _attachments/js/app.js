$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh";
    Backbone.couchConnector.viewName = "byCollection";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;

/////////////////////////////////////////////////////////////////////////////
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
	// Band model
	var BandModel = Backbone.Model.extend({
		initialize : function() {
			if (!this.get("name")) this.set({"name": "Generic Band"});
			if (!this.get("picURL")) this.set({"picURL": "http://images.woome.com/sitemedia/img/picGenericProfile.png"});
			if (!this.get("bio")) this.set({"bio": "They play musical instruments."});
		}
	});

	// Vanue model
	var VenueModel = Backbone.Model.extend({
		initialize : function() {
			if (!this.get("name")) this.set({"name": "Generic Hall"});
			if (!this.get("picURL")) this.set({"picURL": "http://malhotrarealestate.com/assets/images/generic_house_photo03.jpg"});
			if (!this.get("bio")) this.set({"bio": "Has four walls and a roof."});
		}
	});

    // Event model
    var EventModel = Backbone.Model.extend({
        initialize : function(){
            if(!this.get("name")) this.set({"name": "Some generic event"});
            if(!this.get("description")) this.set({"description": "Go here for fun!"});
            if(!this.get("hall")) this.set({"hall": "Generic Hall"});
            if(!this.get("hallPic")) this.set({"hallPic": "http://malhotrarealestate.com/assets/images/generic_house_photo03.jpg"});
            if(!this.get("band")) this.set({"band": "Generic Band"});
            if(!this.get("bandPic")) this.set({"bandPic": "http://images.woome.com/sitemedia/img/picGenericProfile.png"});
			if(!this.get("date")) this.set({"date": new Date().getTime()});
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
        url : "/events",
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
        tagName : "tr",

        // Clicking the feet adds it to the dance card
        events : {
            "click .feet" : "addToDanceCard",
        },
        
        // If there's a change in our model, rerender it
        initialize : function(){
            _.bindAll(this, 'render', "addToDanceCard");
            this.model.bind('change', this.render);
            this.registerTemplate('eventEntry'); // is the "this" valid for this func?  or does it need to be included in the _bindAll ?
        },
        
        // Adds this event to the danceCard collection
        addToDanceCard : function(){
			// nothing here, yet
        }
    });	

	// The view for the primary event list container
    var EventListView = Backbone.View.extend({
        el: $("#model_table"),

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
            var view = new EventEntryView( { model: model } );
            this.el.append( view.render().el );
        }
    });
    
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
	
	// when this inits, it should call Events.fetch(), which should in theory fetch all
	//	of its data; each model is updated and then triggers a change event which is bound to 
	//	the EventView.render call.  
	// When all data is replaced in the collection, the refresh event is triggered which 
	//	then kicks off the collection's render.
	// FIXME: this implies, then, that each Model is rendered twice...!?
	var App = new AppController();
}