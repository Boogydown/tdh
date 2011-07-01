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
    VU.SchemaFormView = Backbone.View.extend({
        builder: new inputEx.JsonSchema.Builder(),

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

    VU.SchemaTableView = VU.DustView.extend({
        initialize : function(){
			this.el.html("");
			this.el.show();
			this.registerTemplate('table-header');			
            _.bindAll(this, 'render', 'reRender', 'addRow');
            this.collection.bind("add", this.reRender);
            this.collection.bind("remove", this.deleted);
			if ( !this.collection.fetched ){
				this.collection.bind("refresh", this.render);
				this.collection.fetch( );
			}
			else
				this.render();
        },

		getData : function () {
            var rowData = [], fields = this.options.schema.properties;
            for (key in fields)
				if ( !fields[key].hidden )
					rowData.push( fields[key].description );
			return {fields:rowData};
		},		

        render: function(){
			this.collection.fetched = true;
			// render from our super
			VU.DustView.prototype.render.call(this);
            if(this.collection.length > 0)
                this.collection.each(this.addRow);
        },
        
		reRender: function() {
			this.el.html("");
			this.el.show();
			this.render();
		},
		
        // Appends an entry row 
        addRow : function(model){
			// triggers an event to load its linkRefs; triggers a band or hall to normalize
			// WARN: if this is truly async, then the data may not change in time for the render, and the "change" event
			//		 bound in SchemaDocView isn't set yet
			model.trigger("change");
            var view = new VU.SchemaDocView({ model: model, schema: this.options.schema, templateName: this.options.templateName });
            this.el.append(view.render().el);
        }
    });
    
    VU.SchemaDocView = VU.DustView.extend({
		el: "<tr class='selectableRow'/>",
		
        events : {
            "click .edit"     : "editMe",
            "click .delete"   : "deleteMe",
            "click .linkable" : "linkMe"
        },

		// If there's a change in our model, rerender it
		initialize : function(){
			_.bindAll(this, 'render', "editMe", "deleteMe");
			this.model.bind('change', this.render);
			this.registerTemplate( this.options.templateName );
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
						row.value = row.value.join(", ");
						
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
			if ( confirm( "This will permanently delete this entry!\n" + 
						  "Are you SURE you want to do this?" ) ) {
				if(this.model)
					this.model.destroy();
				$(this.el).fadeOut("fast",function(){
					$(this).remove();
				});
			}
        }
    });
	
	VU.SchemaDocSoloView = VU.SchemaDocView.extend({
		initialize : function() {
			this.el.html("");				
			if ( this.options.docID && this.options.docID != null && this.options.docID != "" )
			{
				this.model = this.options.collection.get( this.options.docID );
				if ( this.model != null ){
					VU.SchemaDocView.prototype.initialize.call(this);
				}
				this.render();
			}
			else
				this.el.text( this.options.docID + " does not exist!");
		}
	});


/////////////////////////////////////////////////////////////////////////////}
/// URL CONTROLLER //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
    // The App controller initializes the app by calling `Comments.fetch()`
    var App = Backbone.Controller.extend({
		showType : "list",
		collName : "events",
		schemaName : "full",
		docID : "",
		firstPass : true,
		
		routes : { ":type/:coll/:schema/:docID" : "updateShow",
				   ":type/:coll/:schema" : "updateShow",
				   ":type/:coll" : "updateShow",
				   ":type" : "updateShow"
		},
		
		elAttachments : { 
			form: {
				viewClass: "SchemaFormView",
				el : $("#model_edit")
			},
			list: {
				viewClass: "SchemaTableView",
				el: $("#coll_table"),
				templateName: "table-row"
			},
			doc: {
				viewClass: "SchemaDocSoloView",
				el:$("#model_table"),
				templateName: "doc-table"
			}
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
			//normalize the route based on any persistant values
			var collName = collName || this.collName,
				schemaName = schemaName || this.schemaName,
				docID = docID || this.docID,
				showType = showType || this.showType,
				curType, att, curView;
			if ( showType == "doc" && !docID ) showType = "list";
			this.saveLocation( showType + "/" + collName + "/" + schemaName + "/" + docID );

			var coll = this.colls[ collName ];
			var schema = VU.schemas[ collName ][ schemaName ];

			// show & create or hide according to showType
			for ( curType in this.elAttachments ) {
				if ( showType == curType ) {
					this.elAttachments[ curType ].el.slideDown();
					curView = "schemaView" + curType;
					if ( ! this[ curView ] 
						 || this[ curView ].collection != coll 
						 || this[ curView ].options.schema != schema
						 || (this[ curView ].options.docID && this[ curView ].options.docID != docID ) ) {
						att = this.elAttachments[curType];
						att.collection = coll;
						att.schema = schema;
						att.docID = docID;
						this[ curView ] = new VU[att.viewClass]( att );
					} 
				}
				else
					this.elAttachments[ curType ].el.slideUp();
			}
	
			// store for next time
			this.firstPass = false;
			this.collName = collName;
			this.schemaName = schemaName;
			this.docID = docID;			
		},
	});

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{    

	window.app = new App();
	Backbone.history.start();
	
});
