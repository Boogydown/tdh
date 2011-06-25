$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "byType";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;

	// inits all in the VU namespace, specifically Backbone-View attachments to the HTML	
	VU.init();

/////////////////////////////////////////////////////////////////////////////}
/// VIEWS DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{

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

    var SchemaTable = VU.DustView.extend({
        el: $("#coll_table"),

        initialize : function(){
            _.bindAll(this, 'render', 'addRow');
			this.el.show();
			// TODO: hide solo doc view
			this.registerTemplate('table-header');			
            this.collection.bind("refresh", this.render);
            this.collection.bind("add", this.addRow);
            this.collection.bind("remove", this.deleted);
			this.collection.fetch();
        },

		getData : function () {
            var rowData = [], fields = this.options.schema.properties;
            for (key in fields)
				rowData.push( fields[key].description );
			return {fields:rowData};
		},		

        render: function(){
			// render from our super
			VU.DustView.prototype.render.call(this);
            if(this.collection.length > 0)
                this.collection.each(this.addRow);
        },
        
        // Appends an entry row 
        addRow : function(model){
			model.trigger("change");
            var view = new SchemaDocView({ model: model, schema: this.options.schema });
            this.el.append(view.render().el);
        }
    });
    
    var SchemaDocView = VU.DustView.extend({
		el: "<tr/>",
		options : { templateName: "table-row" },		
        events : {
            "click .edit"     : "editMe",
            "click .delete"   : "deleteMe",
            "click .linkable" : "linkMe"
        },

		// If there's a change in our model, rerender it
		initialize : function(){
			_.bindAll(this, 'render', "editMe", "deleteMe");
			this.model.bind('change', this.render);
			this.registerTemplate('table-row');
		},
		
		getData : function () {
            var rowData = [], fields = this.options.schema.properties;
            for (key in fields)
			{
				var row = {key:key, value:this.model.get(key)};
				//TODO: genercize this!  eep!
				if ( key=="bandName" || key=="hallName" )
				{
					var type = key.substr(0,4);
					row.value = "<div class='linkable' _type + "\",\"" + this.model.get(type) + "\")'>" + row.value + "</div>";
				}
				rowData.push( row );
			}
			return {fields:rowData};
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
	
	var SchemaDocSoloView = SchemaDocView.extend({
		el:$("#model_table"),
		
		options : { templateName: "doc-table" },
		initialize : function() {
			if ( options.docID != "" )
			{
				var myDoc = options.collection.get( options.docID );
				if ( myDoc )
				{
					
				}					
			}
			else
				el.text( options.docID + " does not exist!");
				
		}
		// it looks for options.id, if !"" then checks coll for the id
		// if found, fetches, if not, create
		// hides list view (should be passed a ref to schemaTable?)
		// shows its view
		
		
	});


/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var App = Backbone.Controller.extend({
		routes : { "doc/:coll/:docID/:schema": "showDoc",
				   "doc/:coll/:docID": "showDoc",
				   "all/:coll/:schema": "showColl",
				   "all/:coll": "showColl",
				   "form/:coll/:schema": "showForm"
				   "form/:coll": "showForm"
		},
		
		events : { "route:showDoc": "showDoc",
				   "route:showColl": "showColl"
				   "route:showForm": "showForm"
		},					
		
        initialize : function(){
			_.bindAll( this, "showDoc", "showColl" );
			this.colls = {
				bands : new VU.BandCollection(),
				halls : new VU.HallCollection()
			};
			this.colls.events = new VU.EventCollection( null, { this.colls.bands, this.colls.halls});
        },
		
		showDoc : function( param ){
			console.log( "Route to showDoc: " + param );
			//this.schemaDoc = new SchemaDocSoloView({ schema: sfSession.schema, collection: sfSession.colls[type + "s"], docID:docID } ); 			
		},

		showColl : function( param ){
			console.log( "Route to showColl: " + param );
			//this.schemaTable = new SchemaTable({ schema : sfSession.schema, collection: sfSession.colls[type + "s"] });  			
		},
		
		showForm : function( param ){
			console.log( "Route to showForm: " + param );
			//this.schemaForm = new SchemaForm({ schema : VU[type + "_schema_" + (utils.$_GET( "f" ) || "full")], collection: sfSession.colls[type + "s"] 			
		},
		
		
		
    });

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{    

	window.app = new App();
	Backbone.history.start();
	
});
