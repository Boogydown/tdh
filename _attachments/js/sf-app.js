$(function(){
/////////////////////////////////////////////////////////////////////////////}
/// INITIALIZATION //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	// database name, design doc name, and view name
    Backbone.couchConnector.databaseName = "tdh";
    Backbone.couchConnector.ddocName = "tdh_public";
    Backbone.couchConnector.viewName = "byType";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;

	// inits all in the VU namespace, specifically some of our backbone View attachments to the HTML	
	VU.init();

/////////////////////////////////////////////////////////////////////////////}
/// VIEWS DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
	/*
	 * The View for input form based on a doc's schema
	 */
	VU.SchemaFormView = Backbone.View.extend({
        builder: new inputEx.JsonSchema.Builder(),
		docModel: "",

        initialize : function(){
            _.bindAll(this, "onSubmit", "fetched", "fillMe", "attach", "render", "updateUsersOwners");
			this.contentEl = $("#inputExContent");
			this.contentEl.html("");
			this.form = $(this.el).is("form") ? $(this.el) : $("form", this.el);
			if ( $(this.form[0]).is("form") ) this.form = this.form[0];
			$(this.form).undelegate();
			if ( mySession.get("loggedIn") && mySession.get("roles").indexOf("admin") > -1 ){
				if ( !mySession.users ) $.couch.db("_users").allDocs({ success: this.render });
				else this.render();
			}
            else this.render();
        },
        
        render : function(data){
			if ( data ) {
				mySession.users = _.map(data.rows, function(datum) {
					return { label:datum.key, value:datum.id };
				});
			}
			if ( mySession.users )
				this.options.schema.properties.ownerUsers.items.choices = mySession.users;
			
			this.contentEl.html("<div class='loadingBar'>Loading...</div>");
            this.iexDef = this.builder.schemaToInputEx(this.options.schema);
            this.iexDef.parentEl       = 'inputExContent';
            this.iexDef.enctype        = 'multipart/form-data';
			
			// doc ID given?  Then this is an Edit action...
			if ( this.options.docID ) {
				this.docModel = this.collection.get( this.options.docID );
				if ( ! this.docModel ) {
					this.docModel = new this.collection.model({id:this.options.docID});
					this.docModel.collection = this.collection;
					this.docModel.bind( "change", this.fillMe );
					this.docModel.fetch();
				}
				else
					this.fillMe( this.docModel );					
			}
			
			// Fills in the pull-down menus
			// TODO: rewrite these to be more generic; i.e. is a linkRef in the schema
			// TODO: move these band and hall pulldown fills to init and have them fill the schema, like users
			var colls = this.options.collection.colls;
			if ( colls ) {
				this.collsToFetch = 2;
				if ( !colls.bands.fetched ) { colls.bands.bind( "reset", this.fetched ); colls.bands.fetch({field:0}) }
				else this.fetched( colls.bands, {field:0});
				if ( !colls.halls.fetched ) { colls.halls.bind( "reset", this.fetched ); colls.halls.fetch({field:2}) }
				else this.fetched( colls.halls, {field:2});
			}
			else 
				this.attach();
			return this;
        },
		
		fillMe : function( model, options ) {
            this.docModel.unbind("change", this.fillMe);
			this.modelJSON = this.docModel.toJSON();
			if ( this.inputex ) this.inputex.setValue( this.modelJSON() );
			this.docModel.bind("change:ownerUsers", this.updateUsersOwners );
			
			//if ( this.form._rev ) this.form._rev.value = this.docModel.get("_rev");
			//if ( this.form.image ) this.form.image.value = this.docModel.get("image");
			//if ($("#main-photo img", this.form)) $("#main-photo img", this.form).attr("src", this.docModel.get("image"));
			//$(":file",this.form).change({model:this.docModel, el:this.form}, this.addAttachment);
			
			//TODO: when update to jQuery1.7.0, use this:
			//$(this.form).on("change",":file",{model:this.docModel, el:this.form},this.addAttachment);
			$(this.form).delegate(":file","change",{model:this.docModel, el:this.form},this.addAttachment);
		},
		
		// this-context is of file input field
		addAttachment : function ( e ) {
			var form = this.form,
				model = e.data.model,
				url = (_.isString(model.url) ? "/" + model.url : "../..") + (model.id ? "/" + model.id : ""),
				picFile = url + "/" + e.target.value.match(/([^\/\\]+\.\w+)$/gim)[0],
				tmpID = e.target.id;
				
			// find next field... it should be the filename holder
			tmpID = "#yui-gen" + (parseInt(tmpID.match(/gen([0-9]+)/)[1]) + 1) + "-field";
			$(tmpID,form).val( picFile );
			
			// redundant, but useful
			form._rev.value = model.get("_rev");
			
			// Cheat :)
			$(e.target).attr("name","_attachments");
			
			//$("#main-photo", form).html("<div class='spinner' style='top:45px;left:75px;position:relative;'></div>");
			//model.set( {image: picFile}, {silent:true} );  happens on the fetch...
			
			$(form).ajaxSubmit({
				url:  url,
				success: function(resp) {
					// strip out <pre> tags
					var json = JSON.parse(resp = resp.replace(/\<.+?\>/g,''));
					if ("ok" in json) {
						// update our form;
						form._rev.value = json.rev;
						//form.image.value = picFile;
						//model.set( { id: json.id } ); don't need this since we aren't allowing pic upload on signup
						
						// this will allow us to grab the updated _attachments signature from couch so we can save() later
						model.fetch({silent:true, success: function() {
							//$("#main-photo",model.el).html('<img src="' + picFile + '"/>' );
							alert("File uploaded successfully!");
						}} );
					}
					else 
						alert("Upload Failed: " + resp);
				}
			});
		},
		
		updateUsersOwners : function ( model, val, options )
		{
			var prev = model.previous("ownerUsers"),
				added = _(_.difference(val,prev)),
				removed = _(_.difference(prev,val)),
				loaded = {},
				myID = model.id,
				myType = model.myType,
				addFunc = function(userModel){
					var owns = userModel.get("owns"), myCaption, otype = "vyntors";
					switch (myType){
						case "event": 
							myCaption = (model.get("eventType") || "An") + " event on " + model.get("date"); 
							otype = "events";
							break;
						case "band": myCaption = model.get("bandName"); break;
						case "hall": myCaption = model.get("danceHallName"); break;
					};
					owns[otype].push({
						id: myID,
						type: myType,
						caption: myCaption
					});
					userModel.save();
				},
				delFunc = function(userModel){
					var otype = myType == "event" ? "events" : "vyntors",
						owns = userModel.get("owns");
					owns[otype] = _(owns[otype]).reject(function(m){return m.id==myID;});
					userModel.save();
				},
				getting = function(mID,action){
					if ( mID in loaded )
						action(loaded[mID]);
					else
						(loaded[mID] = new VU.MemberModel({id:mID})).fetch({
							success: function(m){action(m);}
						});
				};
			// our current user is loaded, so add it
			loaded[mySession.id] = mySession;
			added.each( function(m){ getting(m,addFunc); } );
			removed.each( function(m){ getting(m,delFunc); });		
		},
		
		fetched : function( coll, options ) {
			coll.fetched = true;
			coll.unbind( "reset", this.fetched );
			this.iexDef.fields[options.field].choices = _.map( coll.models, function(model) {
				// TODO: yeaaaahhh.... this needs to be fixed.  Should not have hardcoded values here.  Perhaps make "name" mandatory on all docs?
				var name = model.get("bandName") || model.get("danceHallName");
				return { label:name , value:model.get("_id") };
			} );
            // add blanks to beginning
			this.iexDef.fields[options.field].choices.unshift({value:"", label: ""});
            if ( --this.collsToFetch == 0 )
				this.attach();
		},
		
		attach : function () {
			this.contentEl.html("");
            this.inputex = inputEx(this.iexDef);
			if (this.modelJSON) this.inputex.setValue(this.modelJSON);
			$(document.forms[0].date).datepicker({
				dateFormat: "MM d, yy",
				showOn: "both",
				buttonImage: "js/lib/inputex/images/calendar.gif",
				buttonImageOnly: true
			});

            // YUI onClick used instead of Backbone delegateEvents, because it worked first
            new inputEx.widget.Button({
                id:             'send',
                parentEl:       'model_edit',
                type:           'submit',
                onClick:        this.onSubmit,
                value:          'Send'
            });			
            new inputEx.widget.Button({
                id:             'cancel',
                parentEl:       'model_edit',
                onClick:        this.onCancel,
                value:          'Cancel'
            });			
		},

        // Takes the vals from the input fields and submits them to the Collection
        onSubmit : function(){
			var values = this.inputex.getValue();
			values.type = this.options.collection.url;
			
			//not sure why inputex doesn't pull this... :-/
			values._rev = this.form._rev.value;
			
			// Nuke an empty ID, so it doesn't kill initial creation
			if(values._id === "") delete values._id;
			
			//we got these earlier, upon file upload
			delete values._attachments;
			
			// Helper func that adds a logged-in user as owner of an event
			//TODO: make this more generic, not just event;
			var coll = this.collection;
			var updateSession = function(model) {
				if ( coll instanceof VU.EventCollection && mySession.get("loggedIn") ){
					mySession.get("owns").events.push({
						id: model.id,
						caption: (model.get("eventType") || "An") + " event on " + model.get("date")
					});
					mySession.save();
				}
			};				
				
			// update/create model and cleanup
			if ( this.docModel ){
				this.docModel.save(values,{error:function(e){alert("Error updating document!\n" + e.message);}});
				this.docModel.unbind("change:ownerUsers", this.updateUsersOwners);
				if ( ! this.collection.get(this.docModel) )
                   this.collection.add(this.docModel, {silent: true});
			}
			else this.collection.create(values, {success:updateSession});
			
			//document.forms[0].reset();
			this.onCancel();
		},
		
		onCancel : function(){
			//$(this.form).undelegate();
			if ( window.location === window.parent.location )
				location.href = "#list";
			else
				window.parent.parent.location.reload();
		}
    });

	/*
	 * This is the View for a table of multiple docs
	 */
    VU.SchemaTableView = VU.DustView.extend({
        initialize : function(){
			this.el.html("<div class='loadingBar'>Loading...</div>");
			this.registerTemplate('table-header');			
            _.bindAll(this, 'render', 'reRender', 'addRow');
            this.collection.bind("add", this.reRender);
            this.collection.bind("remove", this.deleted);
			if ( !this.collection.fetched ){
				this.collection.bind("reset", this.render);
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
				pageString += "<a href='#////0'>1</a> ...";
			for ( i = start; i <= end; i++ )
				if ( i == curPage )
					pageString += " " + (i+1) + " ";
				else
					pageString += " <a href='#////" + i + "'>" + (i+1) + "</a> ";
			if ( end  < maxPage ) 
				pageString += "... <a href='#////" + maxPage + "'>" + (maxPage+1) + "</a>";
			
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

            // render by page number
			if(this.collection.length > 0){
				var i, 
					start = this.options.curPage * this.options.numPerPage, 
					end = start + this.options.numPerPage; 
				if ( end > this.collection.length ) end = this.collection.length;
				for ( var i = start; i <= end; i++ ) this.addRow( this.collection.models[i] );
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
			if ( ! model ) return;
			model.trigger("change", model);
			// TODO: can't we just pass "options" down??
            var view = new VU.SchemaDocView({ 
				model: model, 
				schema: this.options.schema, 
				templateName: this.options.templateName,
				schemaName: this.options.schemaName,
				collName: this.options.collName,
				hidden: this.options.hidden });
            this.el.append(view.render().el);
        }
    });
    
	/**
	 * Doc View, attached to one model
	 * (per row View of SchemaTableView, or base class for DocSoloView)
	 */
    VU.SchemaDocView = VU.DustView.extend({
		el: "<tr class='selectableRow'/>",
		clickDest: "",
        events : {
            "click .edit"     : "editMe",
			"click .delete"   : "deleteMe"
            //"click .linkable" : "linkMe"
        },

		// If there's a change in our model, rerender it
		initialize : function(){
			if ( !this.options.hidden )
			{
				try {
					//this.el.setAttribute("onclick", "location.href='#doc/"
					this.clickDest = "location.href='#doc/"
						+ this.options.collName + "/" 
						+ this.options.schemaName + "/" 
						+ this.model.id + "'";
				} catch (e) {}
			}
			_.bindAll(this, 'render', "editMe", "deleteMe", "renderValue");
			this.model.bind('change', this.render);
			this.registerTemplate( this.options.templateName );
		},
		
		getData : function () {
            var rowData = [], fields = this.options.schema.properties, row;
            for (key in fields){
				row = this.renderValue( key, fields[key], this.model.get(key) );
				if ( row != null ) rowData.push( row );
			}
			return {fields:rowData};
		},
		
		renderValue : function ( key, schemaProp, modelVal ) {
			var text = "", tmp = "", subProps, subProp, subType, row = { key:key };
			if ( !schemaProp || schemaProp.hidden ) return null;
			modelVal = modelVal || " ";
				
			// array? if not array in schema then just [0], otherwise run renderer on all values
			if ( _.isArray( modelVal ) && modelVal.length && schemaProp.type != "array" )
				modelVal = modelVal[0];
				
			// cheat a little or the field type
			var fieldType = schemaProp.type;
			if ( schemaProp.linkVal ) fieldType = "linkVal";
			if ( schemaProp.picUrl ) fieldType = "picUrl";
				
			// Switch on the schema property to determine how it's displayed
			switch ( fieldType ) {
				case "array" : 
					row.className="bigCell";
					subProps = schemaProp.items && schemaProp.items.properties;
					subType = schemaProp.items && schemaProp.items.type;
					for ( var x in modelVal ){
						if ( subType == "object" )
							//it's an object, so lets display all of its sub values
							for ( subProp in subProps )
								text += this.renderValue( subProp, subProps[subProp], modelVal[x][subProp] ).value + ", ";
						else
							text += this.renderValue( key, schemaProp.items, modelVal[x] ).value + ", ";
						text += "<br/>";
					}
					break;
				//case "file" : 
				case "picUrl" : 
					if ( schemaProp.clickable )
						text = '<a href="../../' + this.model.id + "/files/" + modelVal + '"><img src="../../' + this.model.id + "/thumbs/" + modelVal + '"/> ' + modelVal + '</a>';
					else
						text = '<img src="../../' + this.model.id + "/thumbs/" + modelVal + '"/></a>';
					break;
				case "url" :
					text = '<a href="http://' + modelVal + '">' + modelVal + '</a>';
					break;
				case "linkVal" :
					if ( !this.options.hidden ){
						var tmpLinkRef = schemaProp.linkVal.linkRef;
						text = '<a href="#doc/' + this.options.schema.properties[tmpLinkRef].linkRef + '/full/' + this.model.get(tmpLinkRef) + '">' + modelVal + '</a>';
					}
					else text = modelVal;
					break;
				default:
					// fixed width on long entries
					if ( modelVal.length > 40 ) row.className="bigCell";
					text = modelVal;
					if ( this.clickDest )
						row.clickDest = this.clickDest;
			}
			row.value = text;
			return row;
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
			location.href="#form/"
				+ this.options.collName + "/" 
				+ this.options.schemaName + "/" 
				+ this.model.id;
		}
    });
	
	/*
	 * Extension of SchemaDocView that allows you show just one doc, by itself
	 */
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
    /*
	 * Overall controller for the whole schemaForm app.  Routes all post-hash addresses to different Views
	 * 
	 * url#showType/collName/schemaName/docID/pageNum/numPerPage/hideNavigation
	 * showType - none, list, form, doc
	 * collName - name of the collection (bands, halls, events, etc)
	 * schemaName - name of the schema to use (full, etc)
	 * docID - for "doc" showType, the id of the single doc to show
	 * pageNum - for list view, the page to view (default 0)
	 * numPerPage - for list view, the number of items per page (default 20)
	 * hideNavigation - 1 = hide, 2 = don't hide, all navigation (good for showing JUST the data as single page)
	 *
	 * All values are saved to the controller and on hashChange, incomplete hashes (i.e. #list or #////5) have
	 * blank values filled in, respectively, from the saved version
	 */
    var App = Backbone.Router.extend({
		// default params:
		showType : "list",
		collName : "events",
		schemaName : "full",
		docID : "",
		curPage : 0,
		numPerPage: 20,
		hidden : 1, /* 1 = hidden, 2 = not hidden */

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
			this.colls.events.viewName = "crossFilter";
			this.colls.events.query = 
				"?startkey=" + JSON.stringify( ["event",new Date().getTime() - 2*24*60*60*1000] ) + 
				"&endkey=" + JSON.stringify( ["event",[]] );
				
			window.mySession = new VU.MemberModel();
        },

		updateShow : function( showType, collName, schemaName, docID, curPage, numPerPage, hidden ) {
			// can only show one panel at a time
			// if our showType is already shown then 2nd click will hide it (i.e. "none")
			//if ( showType && showType == this.showType && collName == undefined ) showType = "none";

			// reset default page # if changing colls or numPerPage...
			if ( (collName && collName != this.collName) || (numPerPage && numPerPage != this.numPerPage) )
				this.curPage = 0;

			// normalize the route based on any persistant values 
			// (i.e. for urls without all the /params after the hash, we'll just used the previous, saved value)
			var collName 	= collName 	|| this.collName,
				schemaName 	= schemaName|| this.schemaName,
				showType 	= showType 	|| this.showType,
				docID 		= docID 	|| this.docID,
				curPage 	= curPage 	|| this.curPage,
				numPerPage 	= numPerPage|| this.numPerPage,
				hidden		= hidden 	|| this.hidden,
				curType, att, curView;
				
			// point this.hideStyle to the actual CSS rule stored in the HTML, so we can alter it on the fly
			if ( ! this.hideStyle ) {
				// IE7 doesn't have "cssRules"; only "rules"
				var cssRules = document.styleSheets[0].cssRules || document.styleSheets[0].rules;
				for ( var i in cssRules )
					if ( cssRules[i].selectorText == ".hideable" ) {
						this.hideStyle = cssRules[i].style;
						break;
					}
			}
			if ( this.hideStyle ) this.hideStyle.display = (hidden == 1 ? "none" : "");
			
			// if doc requested, but no docID, then revert back to list
			if ( showType == "doc" && !docID ) showType = "list";
			
			// since incomplete hashes are filled out via saved values, we need to reset the hash in the actual 
			// URL so that it reflects the full, actual hash url that we're at.  This maintains the RESTful functionality
			this.navigate( showType + 
							   "/" + collName + 
							   "/" + schemaName + 
							   "/" + docID + 
							   "/" + curPage + 
							   "/" + numPerPage +
							   "/" + hidden );

			// pull up the collection and schema based on the params
			var coll = this.colls[ collName ];
			var schema = VU.schemas[ collName ][ schemaName ];

			// show & create or hide according to showType
			for ( curType in this.elAttachments ) {
				if ( showType == curType ) {
					this.elAttachments[ curType ].el.slideDown();
					this.elAttachments[ curType ].el.show();
					curView = "schemaView" + curType;

					// redraw if collection, schema, page#, num per page, or docID change
					if ( ! this[ curView ] 
						 || this[ curView ].collection != coll 
						 || this[ curView ].options.schema != schema
						 || this[ curView ].options.curPage != curPage 
						 || this[ curView ].options.numPerPage != numPerPage
						 || this[ curView ].options.docID != docID ) {
			
						//TODO: remove the local var copies of these params (just keep them in this) and 
						//		use _.extend( att, this, this.elAttachment[curType] );
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
					// hide all non-selected showTypes
					this.elAttachments[ curType ].el.slideUp();
			}
	
			// store for next time (get rid of these as part of that last TODO)
			this.showType = showType;
			this.collName = collName;
			this.schemaName = schemaName;
			//this.docID = docID; 	//don't save
			this.curPage = curPage;
			this.numPerPage = numPerPage;
			this.hidden = hidden;
		}
	});

/////////////////////////////////////////////////////////////////////////////}
/// INSTANCIATION & EXECUTION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{    

	window.app = new App();
	Backbone.history.start();
	
});
