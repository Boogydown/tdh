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
    VU.SchemaFormView = Backbone.View.extend({
        builder: new inputEx.JsonSchema.Builder(),

        initialize : function(){
			this.el.html("");
            _.bindAll(this, "onSubmit", "fetched", "attach");
            this.render();
        },
        
        render : function(){
			this.el.html("<div class='loadingBar'>Loading...</div>");
            this.form = this.builder.schemaToInputEx(this.options.schema);
            this.form.parentEl       = 'model_edit';
            this.form.enctype        = 'multipart/form-data';
			var colls = this.options.collection.colls;
			if ( colls ) {
				this.collsToFetch = 2;
				if ( !colls.bands.fetched ) { colls.bands.bind( "refresh", this.fetched ); colls.bands.fetch({field:0}) }
				else this.fetched( colls.bands, {field:0});
				if ( !colls.halls.fetched ) { colls.halls.bind( "refresh", this.fetched ); colls.halls.fetch({field:5}) }
				else this.fetched( colls.halls, {field:5});
			}
			else 
				this.attach();
			
            return this;
        },
		
		fetched : function( coll, options ) {
			coll.fetched = true;
			coll.unbind( "refresh", this.fetched );
			this.form.fields[options.field].elementType.choices = _.map( coll.models, function(model) {
				var name = model.get("bandName");
				if ( !name ) name = model.get("danceHallName");
				return { label:name , value:model.get("_id") };
			} );
			if ( --this.collsToFetch == 0 )
				this.attach();
		},
		
		attach : function () {
			this.el.html("");
            this.inputex = inputEx(this.form);

            // YUI onClick used instead of Backbone delegateEvents, because it worked first
            new inputEx.widget.Button({
                id:             'send',
                parentEl:       'model_edit',
                type:           'submit',
                onClick:        this.onSubmit,
                value:          'Send'
            });			
		},

        // Takes the vals from the input fields and submits them to the Collection
        onSubmit : function(){
			var values = this.inputex.getValue();
			values.type = this.options.collection.url;
			// grab image filenames from inputs
			var ifilelist = this.el[0].image;
			
			// inject the files from the from into the JSON that we're going to send to the db
			this.injectFiles( this.el[0].image, "images", "image", values );
			this.injectFiles( this.el[0].attachedReferenceDocument, "documents", "attachedReferenceDocument", values );

			// Nuke an empty ID, so it doesn't kill initial creation
			if(values._id === "") delete values._id;
			this.collection.create(values);
			document.forms[0].reset();
			location.href = "#list";
		},			

		injectFiles : function( filelist, property, fileKey, values ) {
			if ( ! filelist ) filelist = [];
			if ( filelist.length == undefined ) filelist = [ filelist ];
			var len = filelist.length;
			if ( len ) {
				values._attachments = {};
				var ifn = "";
				//var accept = {"image/jpeg": 23, "image/png": 22}

				//iterate through list of image files and upload as attachments	
				for ( var i = 0; i < len; i++ ) {
					ifn = filelist[i].files[0].name;
					values[property][i][fileKey] = ifn;
					values._attachments["files/" + ifn] = {
						"content_type": "image/jpeg", 
						"data": filelist[i].files[0].getAsDataURL().slice(23)
					};
				}
			}			
        }
    });

    VU.SchemaTableView = VU.DustView.extend({
        initialize : function(){
			this.el.html("<div class='loadingBar'>Loading...</div>");
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
            var rowData = [], 
				myData = { },
				maxPage = Math.floor(this.collection.length / this.options.numPerPage),
				curPage = this.options.curPage || 0,
				fields = this.options.schema.properties,
				pageString = "",
				start, end, key;
				
			// grab all unhidden fields
            for (key in fields) if ( !fields[key].hidden ) rowData.push( fields[key].description );

			// prev/next page
			if ( curPage > 0 ) myData.prevPage = curPage - 1;
			if ( curPage < maxPage ) myData.nextPage = curPage + 1;
			
			// page# list
			start = curPage - 3 < 0 ? 0 : curPage - 3;
			end = curPage + 3 > maxPage ? maxPage : curPage + 3;
			if ( start > 0 ) 
				pageString += "<a href='#////0'>0</a> ...";
			for ( i = start; i <= end; i++ )
				if ( i == curPage )
					pageString += " " + i + " ";
				else
					pageString += " <a href='#////" + i + "'>" + i + "</a> ";
			if ( end  < maxPage ) 
				pageString += "... <a href='#////" + maxPage + "'>" + maxPage + "</a>";
			
			// bundle up and deliver
			myData.fields = rowData;
			myData.curPage = curPage;
			myData.maxPage = maxPage;
			myData.pageList = pageString;
			return myData;
		},		

        render: function(){
			this.collection.fetched = true;
			// render from our super
			VU.DustView.prototype.render.call(this);
            if(this.collection.length > 0){
				//this.collection.each(this.addRow);
				var i, 
					start = this.options.curPage * this.options.numPerPage, 
					end = start + this.options.numPerPage; 
				if ( end > this.collection.length ) 
					end = this.collection.length;
				for ( var i = start; i <= end; i++ )
					this.addRow( this.collection.models[i] );
			}
        },
        
		reRender: function() {
			this.el.html("Loading...");
			this.render();
		},
		
        // Appends an entry row 
        addRow : function(model){
			// triggers an event to load its linkRefs; triggers a band or hall to normalize
			// WARN: if this is truly async, then the data may not change in time for the render, and the "change" event
			//		 bound in SchemaDocView isn't set yet
			model.trigger("change", model);
            var view = new VU.SchemaDocView({ 
				model: model, 
				schema: this.options.schema, 
				templateName: this.options.templateName,
				schemaName: this.options.schemaName,
				collName: this.options.collName });
            this.el.append(view.render().el);
        }
    });
    
	/**
	 * Doc View, attached to one model
	 */
    VU.SchemaDocView = VU.DustView.extend({
		el: "<tr class='selectableRow'/>",
        events : {
            "click .edit"     : "editMe",
            "click .delete"   : "deleteMe",
            "click .linkable" : "linkMe"
        },

		// If there's a change in our model, rerender it
		initialize : function(){
			try {
				this.el.setAttribute("onclick", "location.href='#doc/"
					+ this.options.collName + "/" 
					+ this.options.schemaName + "/" 
					+ this.model.id + "'");
			} catch (e) {}
			_.bindAll(this, 'render', "editMe", "deleteMe");
			this.model.bind('change', this.render);
			this.registerTemplate( this.options.templateName );
		},
		
		getData : function () {
            var rowData = [], 
				fields = this.options.schema.properties, 
				tmpLinkRef, key, vals;
            for (key in fields) {
				if ( ! fields[key].hidden ) {
					var row = {key:key, value:this.model.get(key)};
					var tmp = "";
					// array?
					if ( row.value ) {
						if ( _.isArray(row.value) && row.value.length )
							row.value = row.value[0];
						if ( row.value.image ) {
							tmp = row.value.credit;
							row.value = row.value.image;
						} 
						else if ( row.value.attachedReferenceDocument ) {
							tmp = row.value.documentName;
							row.value = row.value.attachedReferenceDocument;
						}
						row.value = row.value || " ";

						if ( _.isString(row.value) ) {					
							// attachment?
							if ( row.value[row.value.length - 4] == "." )
								row.value = '<a href="../../' + this.model.id + "/files/" + row.value + '"><img src="../../' + this.model.id + "/thumbs/" + row.value + '"/> ' + tmp + '</a>';
							
							// fixed width on long entries
							if ( row.value.length > 40 )
								row.className="bigCell";
								
							// any stray links?
							if ( row.value.substr(0, 4).toLowerCase() == "www." )
								row.value = '<a href="http://' + row.value + '">' + row.value + '</a>';
								
							// doc link?
							if ( fields[key].linkVal && !this.options.hidden ){
								tmpLinkRef = fields[key].linkVal.linkRef;
								row.value = '<a href="#doc/' + fields[tmpLinkRef].linkRef + '/full/' + this.model.get(tmpLinkRef) + '">' + row.value + '</a>';
							}
							
						}			
					}
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
			location.href="#list";
        },
		
		editMe : function() {
			alert("Edit not yet supported!");
		}
    });
	
	VU.SchemaDocSoloView = VU.SchemaDocView.extend({
		initialize : function() {
			this.el.html("");				
			_.bindAll( this, "loadModel" );
			if ( this.options.docID && this.options.docID != null && this.options.docID != "" )
			{
				this.model = this.options.collection.get( this.options.docID );
				if ( !this.model ){
					this.model = new this.options.collection.model({id:this.options.docID, collection:this.options.collection});
					this.options.collection.add( this.model );
					this.model.bind("change", this.loadModel);
					this.model.fetch();
				}
				else 
					this.loadModel( this.model );
			}
		},
		
		loadModel : function( model ) {
			if ( model != null ){
				model.unbind( "change", this.loadModel );
				VU.SchemaDocView.prototype.initialize.call(this);
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
		curPage : 0,
		numPerPage: 20,
		firstPass : true,
		hidden : 2, /* 1 = hidden, 2 = not hidden */
		
		routes : { ":type/:coll/:schema/:docID/:page/:numPer/:hidden" : "updateShow",
				   ":type/:coll/:schema/:docID/:page/:numPer" : "updateShow",
				   ":type/:coll/:schema/:docID/:page" : "updateShow",
				   ":type/:coll/:schema/:docID" : "updateShow",
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

		updateShow : function( showType, collName, schemaName, docID, curPage, numPerPage, hidden ) {
			// can only show one panel at a time
			// if our showType is already shown then 2nd click will hide it (i.e. "none")
			if ( showType && showType == this.showType && collName == undefined ) showType = "none";

			// normalize the route based on any persistant values
			var collName 	= collName 	|| this.collName,
				schemaName 	= schemaName|| this.schemaName,
				showType 	= showType 	|| this.showType,
				docID 		= docID 	|| "", 	/* not saved */
				curPage 	= curPage 	|| this.curPage,
				numPerPage 	= numPerPage|| this.numPerPage,
				hidden		= hidden 	|| this.hidden,
				curType, att, curView;
				
			if ( hidden == 1 ) $(".hideable").hide("fast"); else $(".hideable").show("fast");
			if ( showType == "doc" && !docID ) showType = "list";
			this.saveLocation( showType + 
							   "/" + collName + 
							   "/" + schemaName + 
							   "/" + docID + 
							   "/" + curPage + 
							   "/" + numPerPage +
							   "/" + hidden );

			var coll = this.colls[ collName ];
			var schema = VU.schemas[ collName ][ schemaName ];

			// show & create or hide according to showType
			//TODO: have the View be responsible for determining if it should be redrawn or not
			for ( curType in this.elAttachments ) {
				if ( showType == curType ) {
					this.elAttachments[ curType ].el.slideDown();
					curView = "schemaView" + curType;
					if ( ! this[ curView ] 
						 || this[ curView ].collection != coll 
						 || this[ curView ].options.schema != schema
						 || this[ curView ].options.curPage != curPage 
						 || this[ curView ].options.numPerPage != numPerPage
						 || showType == "doc" ) {/* doc showtypes get rerendered each time, regardless */
						att = this.elAttachments[curType];
						att.collName = collName;
						att.collection = coll;
						att.schemaName = schemaName;
						att.schema = schema;
						att.docID = docID;
						att.curPage = Number(curPage);
						att.numPerPage = Number(numPerPage);
						att.hidden = hidden == 1;
						this[ curView ] = new VU[att.viewClass]( att );
					}
				}
				else
					this.elAttachments[ curType ].el.slideUp();
			}
	
			// store for next time
			this.showType = showType;
			this.collName = collName;
			this.schemaName = schemaName;
			this.docID = docID;			
			this.curPage = curPage;
			this.numPerPage = numPerPage;
			this.hidden = hidden;
		},
	});

/////////////////////////////////////////////////////////////////////////////}
/// INSTACIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{    

	window.app = new App();
	Backbone.history.start();
	
});
