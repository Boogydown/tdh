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
        el: $("#model_table"),

        initialize : function(){
            _.bindAll(this, 'render', 'addRow');
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
            var view = new SchemaTableRow({model: model, schema: this.options.schema});
            this.el.append(view.render().el);
        }
    });
    
    var SchemaTableRow = VU.DustView.extend({
		el: "<tr/>",
		
        events : {
            "click .edit"   : "editMe",
            "click .delete" : "deleteMe"
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
				rowData.push( this.model.get(key) );
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

/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var App = Backbone.Controller.extend({
        initialize : function(){
            //Comments.fetch();
        }
    });

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{    

	var colls = {
		bands : new VU.BandCollection(),
		halls : new VU.HallCollection(),
		events : new VU.EventCollection(null, {bandsColl:this.bands, hallsColl:this.halls})
	};

	// c = collection (event, band, or hall)
	// f = show form (0 or 1)
	// d = show just one doc (doc ID)
	var type = utils.$_GET( "c" ) || "event";
	var schema = VU[type + "_schema_" + (utils.$_GET( "s" ) || "full")];
	if ( utils.$_GET( "f" ) == "1" )
		schemaForm = new SchemaForm({ schema : schema, collection: colls[type + "s"] });
	var docID = utils.$_GET( "d" );
	if ( docID )
		{}//TODO: show only a table of the given doc
	else
		// no single doc, so show the whole table.
		schemaTable = new SchemaTable({ schema : schema, collection: colls[type + "s"] });  

});
