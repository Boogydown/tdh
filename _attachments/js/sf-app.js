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
/// MODEL DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	var SessionModel = Backbone.Model.extend({
		
	});

/////////////////////////////////////////////////////////////////////////////}
/// VIEWS DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{

    var SchemaFormView = Backbone.View.extend({
        builder: new inputEx.JsonSchema.Builder(),

        el : $("#model_edit"),

        initialize : function(){
			this.el.html("");
            _.bindAll(this, "onSubmit");
			this.el.show();
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

    var SchemaTableView = VU.DustView.extend({
        el: $("#coll_table"),

        initialize : function(){
			this.el.html("");
            _.bindAll(this, 'render', 'addRow');
			this.registerTemplate('table-header');			
            this.collection.bind("refresh", this.render);
            this.collection.bind("add", this.addRow);
            this.collection.bind("remove", this.deleted);
			this.el.show();
			this.collection.fetch( );
        },

		getData : function () {
            var rowData = [], fields = this.options.schema.properties;
            for (key in fields)
				if ( !fields[key].hidden )
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
            var view = new SchemaDocView({ model: model, schema: this.options.schema });
            this.el.append(view.render().el);
			model.trigger("change");
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
            var rowData = [], fields = this.options.schema.properties, tmpLinkRef;
            for (key in fields)
			{
				if ( ! fields[key].hidden )
				{
					var row = {key:key, value:this.model.get(key)};
					
					// array?
					if ( row.value && _.isArray(row.value)) 
						row.value = row.value[0];
						
					// any stray links?
					if ( row.value && row.value.substr(0, 4).toLowerCase() == "www." )
						row.value = '<a href="http://' + row.value + '">' + row.value + '</a>';
						
					// doc link?
					if ( fields[key].linkVal ){
						tmpLinkRef = fields[key].linkVal.linkRef;
						row.value = '<a href="#doc/' + fields[tmpLinkRef].linkRef + '/full/' + this.model.get(tmpLinkRef) + '">' + row.value + '</a>';
					}
					
					// image?
					try {
						if ( row.value.substr(row.value.length - 3 ).toLowerCase() == "jpg")
							row.value = '<img src="' + row.value + '"/>';
					} catch (e) {}
					
					
					rowData.push( row );
				}
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
			this.el.html("");				
			if ( this.options.docID != "" )
			{
				this.model = this.options.collection.get( this.options.docID );
				if ( this.model != null ){
					SchemaDocView.prototype.initialize.call(this);
				}
			}
			else
				this.el.text( this.options.docID + " does not exist!");
				
			this.render();
		}
	});


/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var App = Backbone.Controller.extend({
		collName : "events",
		schemaName : "full",
		docID : "",
		firstPass : true,
		
		routes : { ":type/:coll/:schema/:docID" : "updateShow",
				   ":type/:coll/:schema" : "updateShow",
				   ":type/:coll" : "updateShow",
				   ":type" : "updateShow"
		},
		
		events : { "route:updateShow": "updateShow" },
		
        initialize : function(){
			_.bindAll( this, "updateShow" );
			this.colls = {
				bands : new VU.BandCollection(),
				halls : new VU.HallCollection()
			};
			this.colls.events = new VU.EventCollection( null, { colls:this.colls, schema:VU.schemas.events.listing });
        },

		updateShow : function( showType, collName, schemaName, docID ) {
			//defaults
			var collName = collName || this.collName;
			var schemaName = schemaName || this.schemaName;
			var docID = docID || this.docID;
			showType = showType || "list";
			if ( showType == "doc" && !docID ) showType = "list";
	
			// reload all views if any of the data changes
			if ( this.firstPass || ( collName != this.collName || schemaName != this.schemaName || docID != this.docID ) ) {
				var coll = this.colls[ collName ];
				var schema = VU.schemas[ collName ][ schemaName ];
				this.schemaTable = new SchemaTableView({ schema: schema, collection: coll });
				this.schemaForm = new SchemaFormView({ schema: schema, collection: coll });
				this.schemaDoc = new SchemaDocSoloView({ schema: schema, collection: coll, docID:docID });
			}
			
			this.firstPass = false;
			this.collName = collName;
			this.schemaName = schemaName;
			this.docID = docID;
			
			// show/hide according to showType
			this.schemaForm.el[ showType == "form" || showType == "all" ? "show" : "hide" ]( "slow" );
			this.schemaTable.el[ showType == "list" || showType == "all" ? "show" : "hide" ]( "slow" );
			this.schemaDoc.el[ showType == "doc" || showType == "all" ? "show" : "hide" ]( "slow" );
		},
	});

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{    

	window.app = new App();
	Backbone.history.start();
	
});
