inputEx

$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "byType";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;

    var DancehallModel = Backbone.Model.extend({
    });

    var DancehallCollection = Backbone.Collection.extend({
        url : "/dancehall",
        model : DancehallModel
    });

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
            return new Date( event.get("date") ).getTime();
        }
    });

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
    

    // The App controller initializes the app by calling `Comments.fetch()`
    var App = Backbone.Controller.extend({
        initialize : function(){
            Comments.fetch();
        }
    });


    
    
    var SchemaForm = Backbone.View.extend({
        builder: new inputEx.JsonSchema.Builder(),

        el : $("#model_edit"),

        initialize : function(){
            _.bindAll(this, "onSubmit");
            this.render();
        },
        
        render : function(){
            var form = this.builder.schemaToInputEx(this.options.schema);
            form.parentEl       = 'model_edit';
            form.enctype        = 'multipart/form-data';
            this.inputex = inputEx(form);

            // YUI onClick used instead of Backbone delegateEvents, because it worked first
            new inputEx.widget.Button({
                id:             'send',
                parentEl:       'model_edit',
                type:           'submit',
                onClick:        this.onSubmit,
                value:          'Send'
            });
            
            return this;
        },

        // Takes the vals from the input fields and submits them to the Collection
        onSubmit : function(){
            values = this.inputex.getValue();
            // Nuke an empty ID, so it doesn't kill initial creation
            if(values._id === "") delete values._id;
            this.collection.create(values);
        }
    });

    var SchemaTable = Backbone.View.extend({
        el: $("#model_table"),

        initialize : function(){
            _.bindAll(this, 'render', 'addRow');

            this.collection.bind("refresh", this.render);
            this.collection.bind("add", this.addRow);
            this.collection.bind("remove", this.deleted);
        },

        render: function(){
            var header, 
                cells = [], 
                fields = this.options.schema.properties;

            this.el.html("");

            for (key in fields)
            {
                cells.push( this.make('th',{},fields[key].description) );
            }
            cells.push( this.make('th',{},"Edit") );
            cells.push( this.make('th',{},"Delete") );

            header = this.make('tr',{},cells);
            this.el.append(header);

            if(this.collection.length > 0){
                this.collection.each(this.addRow);
            }
        },
        
        // Appends an entry row 
        addRow : function(model){
            var view = new SchemaTableRow({model: model, schema: this.options.schema});
            var rendered = view.render().el;
            this.el.append(rendered);
        }
    });
    
    var SchemaTableRow = Backbone.View.extend({
        tagName : "tr",
        
        events : {
            // Clicking the `X` leads to a deletion
            "click .edit"   : "editMe",
            "click .delete" : "deleteMe"
        },

        render: function(){
            var row, 
                fields = this.options.schema.properties;

            for (key in fields)
            {
                this.el.appendChild( this.make( 'td', {}, this.model.get(key) ) );
            }
            this.el.appendChild( this.make( 'td', {className: 'edit'}, "?" ) );
            this.el.appendChild( this.make( 'td', {className: 'delete'}, "X" ) );
            return this;
        },
        
        // Fade out the element and destroy the model
        deleteMe : function(){
            if(this.model)
                this.model.destroy();
            $(this.el).fadeOut("fast",function(){
                $(this).remove();
            });
        }
    });


    var Dancehalls = new DancehallCollection();
    var dancehall_schema = {
        "description":"A dancehall is a venue dedicated to musical performances and dancing",
        "type":"object",
        "properties":{
            "_id":{
                "description": "ID",
                "type":"string",
                "format":"id",
                "optional":true,
                "_inputex": {
                    "_type": "hidden"
                }
            },
            "name":{
                "description": "Dance Hall Name",
                "type":"string",
                "required":true
            },
            "community":{
                "description": "Community",
                "type":"string",
                "optional":true
            },
            "county":{
                "description": "County",
                "type":"string",
                "optional":true
            },
            "address":{
                "description": "Address",
                "type":"string",
                "optional":true
            },
            "directions":{
                "description": "Directions",
                "type":"string",
                "optional":true
            },
            "currentUse":{
                "description": "Current Use",
                "type":"string",
                "optional":true
            },
            "culturalOrigin":{
                "description": "Cultural Origin",
                "type":"string",
                "optional":true
            },
            "numberOfStories":{
                "description": "Number of stories",
                "type":"string",
                "optional":true
            },
            "buildingForm":{
                "description": "Building Form",
                "type":"string",
                "optional":true
            },
            "typeOfConstruction":{
                "description": "Type of Construction",
                "type":"string",
                "optional":true
            },
            "dateBuilt":{
                "description": "Date Built",
                "type":"string",
                "optional":true
            },
            "certaintyOfDate":{
                "description": "Certainty of Date",
                "type":"string",
                "optional":true
            },
            "builder":{
                "description": "Builder",
                "type":"string",
                "optional":true
            },
            "currentOwner":{
                "description": "Current Owner",
                "type":"string",
                "optional":true
            },
            "contact":{
                "description": "Contact",
                "type":"string",
                "optional":true
            },
            "website":{
                "description": "Website",
                "type":"string",
                "optional":true
            },
            "description":{
                "description": "Description",
                "type":"string",
                "optional":true
            },
            "comments":{
                "description": "Comments",
                "type":"string",
                "optional":true
            },
            "historicalNarrative":{
                "description": "Historical Narrative",
                "type":"string",
                "optional":true
            },
            "yourName":{
                "description": "Your name",
                "type":"string",
                "optional":true
            },
            "yourEmail":{
                "description": "Your email",
                "type":"string",
                "optional":true
            },
            "images":{
                "description":"Images",
                "type": "array",
                "optional":true,
                "items":{
                    "type":"object",
                    "properties":{
                        "image": {
                            "description":"Image file",
                            "type":"file",
                            "required":true,
                        },
                        "credit": {
                            "description": "Image credit",
                            "type":"string",
                            "optional":true
                        }
                    }
                }
            },
            "gpsCoordinates":{
                "description": "GPS Coordinates",
                "type":"string",
                "optional":true
            },
            "nationalRegister":{
                "description": "National Register",
                "type":"string",
                "optional":true
            },
            "mapped":{
                "description": "Mapped?",
                "type":"string",
                "optional":true
            },
            "documents":{
                "description": "Documents",
                "type":"array",
                "optional":true,
                "items":{
                    "type":"object",
                    "properties":{
                        "documentName":{
                            "description": "Document Name",
                            "type":"string",
                            "optional":true
                        },
                        "attachedReferenceDocument":{
                            "description": "Attached Reference Document",
                            "type":"file",
                            "required":true
                        },
                        "author":{
                            "description": "Author",
                            "type":"string",
                            "optional":true
                        },
                        "citation":{
                            "description": "Citation",
                            "type":"string",
                            "optional":true
                        }
                    }
                }
            }
        }
    };
   
	var Events = new EventCollection();
    var event_schema = {
        "description":"A basic event is an attraction, a venues, a time",
        "type":"object",
        "properties":{
            "_id":{
                "description": "ID",
                "type":"string",
                "format":"id",
                "optional":true,
                "_inputex": {
                    "_type": "hidden"
                }
            },
            "band":{
                "description": "Band ID",
                "type":"string",
                "required":true
            },
            "date":{
                "description": "Date of event",
                "type":"string",
                "optional":true
            },
            "eventType":{
                "description": "Type of event",
                "type":"string",
                "optional":true
            },
            "hall":{
                "description": "Dancehall ID",
                "type":"string",
                "optional":true
            }
		}
	};
	
	schemaForm = new SchemaForm({ schema : event_schema, collection: Events });
    schemaTable = new SchemaTable({ schema : event_schema, collection: Events });  

});