/**
 * ...
 * @author Dimitri Hammond
 */
VU.InitSFV = function () {
	
	/**
	 * Base class for anything using a form
	 * Must be composed with a Backbone.View subclass
	 */
	VU.FormView = Backbone.View.extend({
		initialize : function() {
			_.bindAll( this, "submitPrep", "validate", "processSuccessFail" );
			this.form = $(this.el).is("form") ? $(this.el) : $("form", this.el);
			this.form.submit( this.submitPrep );
			$(":file",this.form).change({model:this.model, el:this.form}, this.addAttachment);
			//this.model.bind( "change", this.render );
		},
		
		finalize : function() {
			this.form.unbind( "submit" );
			$(":file",this.form).unbind();
			//this.model.unbind( "change", this.render );
		},
		
		// taken from Futon
		submitPrep : function(e) {
			e.preventDefault();
			var data = {};
			$.each($(":input", this.form).serializeArray(), function(i, field) {
				data[field.name] = field.value;
			});
			$(":file", this.form).each(function() {
				data[this.name] = this.value; // file inputs need special handling
			});
			this.submit(data, this.processSuccessFail);
		},
		
		// Stub
		validate : function (data, callback) {
			return true;
		},
		
		// only works for single-file forms, for now
		addAttachment : function ( e ) {
			var form = this.form,
				model = e.data.model,
				picFile = form._attachments.value.match(/([^\/\\]+\.\w+)$/gim)[0],
				url = (model.url ? "/" + model.url : "../..") + (model.id ? "/" + model.id : "");
				
			$("#main-photo", form).html("<div class='spinner' style='top:45px;left:75px;position:relative;'></div>");
			model.set( {image: picFile}, {silent:true} );
			$(form).ajaxSubmit({
				url:  url,
				success: function(resp) {
					// strip out <pre> tags
					var json = JSON.parse(resp = resp.replace(/\<.+?\>/g,''));
					if ("ok" in json) {
						// update our form;
						form._rev.value = json.rev;
						form.image.value = picFile;
						//model.set( { id: json.id } ); don't need this since we aren't allowing pic upload on signup
						
						// this will allow us to grab the updated _attachments signature from couch so we can save() later
						model.fetch({silent:true, success: function() {
							$("#main-photo",model.el).html('<img src="' + url + '/' + picFile + '"/>' );
						}} );
					}
					else 
						alert("Upload Failed: " + resp);
				}
			});
		},

		processSuccessFail : function( errors, href ) {
			if ($.isEmptyObject(errors)) {
				if ( href )
					location.href = href;
				else
					location.hash = "";
			} else {
				var completeMsg = "";
				for (var name in errors) {
					completeMsg += name + ": " + errors[name] + "\n";
				}
				alert( completeMsg );
			}
		},
		
		submit : function(data, callback) {
			if (!this.validate(data, callback)) return;
			this.model.save(data, {
				success: function(){callback();},
				error: callback
			});
			return false;		
		}		
	});

	/**
	 * View that uses inputex to generate a form
	 */
	VU.SchemaFormView = VU.FormView.extend({
		docModel: "",

        initialize : function(){
			this.el.html("");
            _.bindAll(this, "onSubmit", "fetched", "fillMe", "attach", "inputexLoaded", "deleteMe");
			
/*			if ( window.inputEx === undefined )
				utils.bulkLoad([
					"js/lib/inputex/lib/yui/yuiloader/yuiloader.js",
					"js/lib/inputex/lib/yui/dom/dom.js",
					"js/lib/inputex/lib/yui/event/event.js",
					"js/lib/inputex/build/inputex.js",
					"js/lib/inputex/js/fields/FileField.js"
					//"js/lib/inputex/js/fields/DatePickerField.js",
				], this.inputexLoaded);
			else
*/				this.inputexLoaded();
		},
		
		inputexLoaded : function() {
			this.builder = new inputEx.JsonSchema.Builder();
            this.render();
        },
        
        render : function(){
			this.el.append("<div class='loadingBar'>Loading...</div>");
            this.form = this.builder.schemaToInputEx(this.options.schema);
            this.form.parentEl       = 'model_edit';
            this.form.enctype        = 'multipart/form-data';
			
			// doc ID given?  Then this is an Edit action...
			if ( this.options.docID )
				this.collection.serverGet( this.options.docID, this.fillMe, function(m,r,o){alert("Error looking up event: " + r);} );
			
			// Fills in the pull-down menus
			// TODO: rewrite these to be more generic; i.e. is a linkRef in the schema
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
			this.model = model;
			
			// for filling model in case inputex is created later
			this.modelJSON = this.model.toJSON();
			
			if ( this.inputex ) this.inputex.setValue( this.modelJSON() );
		},
		
		fetched : function( coll, options ) {
			coll.fetched = true;
			coll.unbind( "reset", this.fetched );
			this.form.fields[options.field].choices = _.map( coll.models, function(model) {
				// TODO: yeaaaahhh.... this needs to be fixed.  Should not have hardcoded values here.  Perhaps make "name" mandatory on all docs?
				var name = model.get("bandName") || model.get("danceHallName");
				return { label:name , value:model.get("_id") };
			} );
            // add blanks to beginning
			this.form.fields[options.field].choices.unshift({value:"", label: ""});
            if ( --this.collsToFetch == 0 )
				this.attach();
		},
		
		attach : function () {
			$(".loadingBar",this.els).css("display","none");
            this.inputex = inputEx(this.form);
			if (this.modelJSON) this.inputex.setValue(this.modelJSON);
			$(document.forms[0].date).datepicker({
				dateFormat: "MM d, yy",
				showOn: "both",
				buttonImage: "js/lib/inputex/images/calendar.gif",
				buttonImageOnly: true
			});

            // YUI onClick used instead of Backbone delegateEvents, because it worked first
            new inputEx.widget.Button({
                id:         'send',
                parentEl:   'model_edit',
                type:       'submit',
                onClick:    this.onSubmit,
                value:      'Send'
            });			
            new inputEx.widget.Button({
                id:         'cancel',
                parentEl:   'model_edit',
                onClick:    this.onCancel,
                value:      'Cancel'
            });
			
			if ( this.model ) 
				new inputEx.widget.Button({
					id:			'delete',
					parentEl:	'model_edit',
					onClick:	this.deleteMe,
					value:		"Delete"
				});
				
			this.el.append('<input type="hidden" name="image" value="' + this.model.get("image") + '"></input>' + 
						   '<input type="hidden" name="_rev" value="' + this.model.get("_rev") + '"></input>');
			this.formViewInit();
		},

        // Takes the vals from the input fields and submits them to the Collection
        onSubmit : function(){
			//this.model.unbind( "change", this.render );
			
			var values = this.inputex.getValue();
			values.image = form.image.value;
			values.type = this.options.collection.url;
			
			// Nuke an empty ID, so it doesn't kill initial creation
			if(values._id === "") delete values._id;

			// we got attachments earlier, so remove it from here
			if ( values._attachments ) delete values._attachments;
			
			// update ownership
			var coll = this.collection;
			var updateSession = function(model) {
				if ( coll instanceof VU.EventCollection && app.mySession && app.mySession.get("loggedIn") ){
					var events = app.mySession.get("owns").events,
						loc = _(events).chain().pluck("id").indexOf(model.id).value(),
						newOwn = {
							id: model.id,
							caption: (model.get("eventType") || "An") + " event on " + model.get("date")
						};
					if ( loc > -1 )
						events[loc] = newOwn;
					else
						events.push(newOwn);
					app.mySession.save();
					window.parent.location.href="#Dances";
					window.parent.location.reload();
					//location.href="";
				}
			};				

			// update model
			if ( this.model ){
				this.model.save(values, { success: updateSession });
				if ( ! this.collection.get(this.model) )
                   this.collection.add(this.model, {silent: true});
			}
			else this.collection.create(values, {success:updateSession});
			
			document.forms[0].reset();
			this.onCancel();
		},
		
		onCancel : function(){
			location.href = "#///!";
		},
		
        deleteMe : function(){
			if ( this.model && confirm( "This will permanently delete this entry!\n" + 
						  "Are you SURE you want to do this?" ) ) {
				if ( app.mySession && app.mySession.get("loggedIn") ) {
					var owns = app.mySession.get("owns"), modelID = this.model.id;
					owns.events = _.reject(owns.events, function(e){ return e.id == modelID; });
					owns.vyntors = _.reject(owns.vyntors, function(e){ return e.id == modelID; });
				}
				app.mySession.save();
				this.model.destroy({
					success:function(){
						window.parent.location.href = "#Dances";
						window.parent.location.reload();
					}
				});
			}
        }
    });
};