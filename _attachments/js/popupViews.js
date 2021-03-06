VU.InitPopupViews = function () {

/**
 * Popup for creating an event
 */
VU.SchemaFormEventView = VU.PopupView.extend({
	popTemplate : "popupTemplate_editNoPic",
	getCaption: function() {
		return "Add event";
	},
	
	onOpened : function() {
		if ( !this.modelID && !confirm('Texas Dance Hall Preservation, Inc.\n\
EVENT CALENDAR POLICY\n\n\
Texas Dance Hall Preservation, Inc. exists to support traditional family-oriented dance halls. We ask that you keep this in mind when submitting an event for our calendar. We give our member halls and bands priority. \n\n\
Top priority: Dances in traditional Texas dance halls; With live music and a wood floor; and open to all ages\n\
Lower priority: Events where there is no dancing, e.g., a music show or other event where people sit and listen to music. If you submit one of these, please note clearly that there is no dancing.\n\n\
Please do not post events that are not in Texas, that are not in a dance hall (exceptions include the traditional church festivals), are urban honky tonks or chain night clubs.\n\n\
Texas Dance Hall Preservation, Inc. reserves the right to reject any submission.\n\n\
Please click OK if you agree to these terms.')) {location.href="#///!"; return;}
		this.sF = new VU.SchemaFormView({
			el : $("#model_edit"),
			collName : "events",
			collection : this.options.colls.events,
			schemaName : "full_app",
			schema : VU.schemas.events.full_app,
			docID : this.modelID,
			hidden : true
		});
		this.sF.validate = this.validate;
		_.bindAll( this, "onSubmit" );
		this.sF.bind("onSubmit", this.onSubmit);
	},
	
	onClosed : function() {
		this.sF.finalize();
		this.sF = null;
	},
	
    validate : function (data, callback) {
		var result = {};
		if (!data.date || data.date.length == 0)
			result.date = "Please enter a date.";
		if (!data.band || data.band.length == 0)
			result.band = "Please select a band.";
		if (!data.hall || data.hall.length == 0)
			result.hall = "Please select a venue.";			
		if (!data.eventType || data.eventType.length == 0)
			result.eventType = "Please select an event type.";
		if (!data.ageLimit || data.ageLimit.length == 0)
			result.ageLimit = "Please select an age limit.";
			
		if ( _.size(result) > 0 ){
			callback( result );
			return false;
		}
		return true;
    },	

	onSubmit : function(id) {
		var event = app.colls.events.get(id);
		if ( event ) {
			var date = event.get("date");
			new VU.MailerModel({
				recipients: {
					"to": {"TDHP Admin": "admin@texasdancehall.org"},
					"cc": {"Dimitri": "dimitri@vyncup.com"},
					"bcc": {}
				},
				"subject": "Event Added: " + date,
				"message": "Event added!\nBand: " + event.get("bandName") + 
									   "\nHall: " + event.get("hallName") + 
									   "\nDate: " + date + 
									   "\nID: " + id + 
									   "\nBy: " + app.mySession.get("name")
			}).save();
		}
	}	
});	

/**
 * Popup for editing a hall
 */
VU.SchemaFormHallView = VU.PopupView.extend({
	popTemplate : "popupTemplate_editNoPic",
	getCaption: function() {
		return "Edit Hall";
	},
	
	onOpened : function() {
		if ( this.modelID )
			this.sF = new VU.SchemaFormView({
				el : $("#model_edit"),
				collName : "halls",
				collection : this.options.colls.halls,
				schemaName : "app",
				schema : VU.schemas.halls.app,
				docID : this.modelID,
				hidden : true
			});
		else
			location.href="#///!";
	},
	
	onClosed : function() {
		this.sF.finalize();
		this.sF = null;
	}	
});	
	
/**
 * Popup for creating a band
 */
VU.SchemaFormCreateBandView = VU.PopupView.extend({
	popTemplate : "popupTemplate_editNoPic",
	getCaption: function() {
		return "Create Band";
	},
	
	onOpened : function() {
		this.submitted = false;
		this.sF = new VU.SchemaFormView({
			el : $("#model_edit"),
			collName : "bands",
			collection : this.options.colls.bands,
			schemaName : "app_create",
			schema : VU.schemas.bands.app_create,
			//docID : this.modelID,
			hidden : true
		});
		this.sF.validate = this.validate;
		_.bindAll( this, "onSubmit" );
		this.sF.bind("onSubmit", this.onSubmit);
	},
	
	onClosed : function() {
		// if model is already created and in the coll, and not already to edit window, then goto edit
		if ( this.sF.model && this.options.colls.bands.get(this.sF.model.id) )
			this.onSubmit( this.sF.model.id );
		this.sF.finalize();
		this.sF = null;

	},
	
    validate : function (data, callback) {
		var result = {};
		if (!data.bandName || data.bandName.length == 0)
			result.bandName = "Please enter a band name.";
		if ( data.email.match(/([\w-+\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/g) == null )
			result.email = "Please enter a valid, primary contact email address.";
		if (!data.stylesPlayed || data.stylesPlayed.length == 0)
			result.stylesPlayed = "Please select a style of music.";
		
		if ( _.size(result) > 0 ){
			callback( result );
			return false;
		}
		return true;
    },
	
	onSubmit : function(id) {
		if ( !this.submitted ) { // in case onClosed calls us, too
			this.submitted = true;
			var band = app.colls.bands.get(id);
			if ( band ) {
				var name = band.get("bandName");
				new VU.MailerModel({
					recipients: {
						"to": {"TDHP Admin": "admin@texasdancehall.org"},
						"cc": {"Dimitri": "dimitri@vyncup.com"},
						"bcc": {}
					},
					"subject": "Band Added: " + name,
					"message": "Band added!\nName: " + name + "\nID:" + id + "\nBy: " + app.mySession.get("name")
				}).save();
				band.normalizeAttributes();
			}
			location.href = "#///editband&" + id;
		}
	}	
	
});	

/**
 * Popup for editing a band
 */
VU.SchemaFormBandView = VU.PopupView.extend({
	popTemplate : "popupTemplate_editWithPic",
	getCaption: function() {
		return "Edit Band";
	},
	
	onOpened : function() {
		if ( this.modelID )
			this.sF = new VU.SchemaFormView({
				el : $("#model_edit"),
				collName : "bands",
				collection : this.options.colls.bands,
				schemaName : "app",
				schema : VU.schemas.bands.app,
				docID : this.modelID,
				hidden : true
			});
		else
			location.href="#///!";
	},
	
	onClosed : function() {
		this.sF.finalize();
		this.sF = null;
	}	
});	
	
/**
 * Deprecated Popup for creating an event
 */
VU.AddEventPopupView = VU.PopupView.extend({
	popTemplate : "popupTemplate_addEvent",
	getCaption: function() {
		return "Add event";
	},
	
	onOpened : function() {
		if (!confirm('Texas Dance Hall Preservation, Inc.\n\
EVENT CALENDAR POLICY\n\n\
Texas Dance Hall Preservation, Inc. exists to support traditional family-oriented dance halls. We ask that you keep this in mind when submitting an event for our calendar. We give our member halls and bands priority. \n\n\
Top priority: Dances in traditional Texas dance halls; With live music and a wood floor; and open to all ages\n\
Lower priority: Events where there is no dancing, e.g., a music show or other event where people sit and listen to music. If you submit one of these, please note clearly that there is no dancing.\n\n\
Please do not post events that are not in Texas, that are not in a dance hall (exceptions include the traditional church festivals), are urban honky tonks or chain night clubs.\n\n\
Texas Dance Hall Preservation, Inc. reserves the right to reject any submission.\n\n\
Please click OK if you agree to these terms.')) location.href="#///!";
	}
});	

/**
 * Popup for displaying a user's profile
 */
VU.MemberPopupView = VU.PopupView.extend({
	popTemplate : "popupTemplate_member",
	getCaption: function() {
		return "Member Profile";
	},
	
	onOpened : function() {
		this.model.bind( "change", this.render );
	},
	
	onClosed : function() {
		this.model.unbind( "change", this.render );
	},
	
	getData : function() {
		// we need to format the ownership data to be display-friendly		
		var data = VU.LoginPopupView.prototype.getData.call(this),
			owns = app.ownerUsers[this.model.id] || {events:{},vyntors:{}},
			eventsOwn=[], vyntorsOwn=[],
			e = owns.events,
			v = owns.vyntors,
			id;
		for ( id in e )
			eventsOwn.push( {
				id: id,
				caption: e[id].getOwnerCaption()
			} );
		for ( id in v )
			vyntorsOwn.push( {
				id: id,
				caption: v[id].getOwnerCaption(),
				type: v[id].myType
			} );
			
		data.eventsOwn = eventsOwn;
		data.vyntorsOwn = vyntorsOwn;
		if ( vyntorsOwn.length ) data.ownsVyntor = true;
		return data;
	}
});

//== Events Container Base Class ====================================================================
VU.EventsContainerPopupView = VU.PopupView.extend({
	// initialize must be extended to load this.collection
	initialize : function ( options ) {
		_.bindAll( this, "_modelLoaded", "nav", "onOpened" );
		VU.PopupView.prototype.initialize.call( this, options );
	},
	
	getData : function () {
		var data = VU.PopupView.prototype.getData.call( this );
		if ( data.ownerUsers == [] ) 
			data.ownerUsers = null;
		return data;
	},
	
	openPopup : function ( mySession, modelID, navColl, popAry ) {
		this.ncIndex = popAry.length > 1 ? popAry[2] : null;
		this.mySession = mySession;
		if ( !modelID ) return;
		this.navColl = navColl;
		//TODO: show waiting spinner (put into base class; will put spinner in empty popup)
		var model = this.collection.serverGet( modelID, this._modelLoaded );
	},
	
	_modelLoaded : function ( model ) {		
		if ( model && _.isFunction(model.loadEvents) )
				model.loadEvents( this.colls.events );
		VU.PopupView.prototype.openPopup.call( this, model );		
	},
	
	render : function() {
		VU.PopupView.prototype.render.call( this );
		
		// if events exist in model then init the events-list view
		if ( this.model ) this.list = this.model.get("events"); 
		if ( this.list ) {
			(this.eventlistView = new VU.FilteredListView({
				el:"#popuplist",
				emptyMsg: "<i>No upcoming dances scheduled</i>",
				listingClass:VU.EventListingView,
				navPrefix: this.navPrefix,
				collection: this.list
			})).render();			
		}
	},
	
	onOpened : function() {
		var that = this;
		$("#nav-left").click(this.nav);
		$("#nav-right").click(this.nav);
		_.defer( function() {
			that.miniMapView = new VU.MapView({collection: that.list, el: $("#detailmap",that.el).get(0), addressFallback: true});
		});
	},
	
	onClosed : function() {
		$("#nav-left").unbind();
		$("#nav-right").unbind();
		this.navColl = null;
	},
	
	/**
	 * Handler for left and right nav-arrow buttons
	 * This will traverse our navColl.  The navColl is usually the filtered list
	 * that is on the tab behind the current popup
	 */
	nav : function ( event ) {
		// navcoll is used to get the next/prev index... but we're still going to pull from this.collection
		var coll = this.navColl, id, model;
		if ( coll ){
			var index, incDec = function(){
				if ( event.target.id == "nav-left" )
					index = index > 0 ? index - 1 : coll.length - 1;
				else
					index = index < coll.length - 1 ? index + 1 : 0;
			};
			
			//TODO: for events, its index is the index of its element
			if ( this.navColl.model === VU.EventModel ){
				// We need to get index based on the event id cuz they're unique whereas the band/hall id is not
				index = this.ncIndex ? _(this.navColl.pluck("id")).indexOf(this.ncIndex) : -1;
				if (index == -1) index = _(this.navColl.pluck( this.navPrefix )).indexOf( this.model.id );
				incDec();
				model = this.navColl.at(index);
				location.href="#///" + this.navPrefix + "&" + model.get( this.navPrefix ) + "&" + model.id;
			}
			else {
				index = this.navColl.indexOf( this.model );
				incDec();
				location.href="#///" + this.navPrefix + "&" + this.navColl.at(index).id;
			}
		}
	}	
});

/**
 * Popup for seeing more info about a dance hall
 */
VU.HallPopupView = VU.EventsContainerPopupView.extend( {
	popTemplate : "popupTemplate_hall",
	navPrefix : "hall",

	initialize : function ( options ) {
		VU.EventsContainerPopupView.prototype.initialize.call( this, options );
		this.collection = this.colls.halls;
	},
	
	getCaption : function() {
		var caption = "All dancehalls";
		
		// by event
		if ( this.navColl.model === VU.EventModel )
			caption = "All dancehalls with upcoming events";
		else {
			var cf = this.navColl.currentFilters;
		
			// TODO: by geo
			
			// by hall name	
			var filter = _.detect(cf, function(f){return f.key == "danceHallName";})			
			if ( filter ) 
				caption += " matching " + filter.str;
				
			// by county
			filter = _.detect(cf, function(f){return f.key == "county";})
			if ( filter )
				caption += " in county " + filter.str;
		}
		//return "&#9668;&nbsp; " + caption + " &nbsp;&#9658;";
		return "- " + caption + " -";
	}
});

/**
 * Popup for seeing more info about a band
 */
VU.BandPopupView = VU.EventsContainerPopupView.extend( {
	popTemplate : "popupTemplate_band",
	navPrefix : "band",

	initialize : function ( options ) {
		VU.EventsContainerPopupView.prototype.initialize.call( this, options );
		this.collection = this.colls.bands;
	},
	
	getCaption : function() {
		var caption = "All bands";

		// by event
		if ( this.navColl.model === VU.EventModel )
			caption = "All bands with upcoming events";
		else {
			var cf = this.navColl.currentFilters;
			
			// by style			
			var filter = _.detect(cf, function(f){return f.key == "stylesPlayed";})			
			if ( filter ) 
				caption = "All " + filter.start + " bands";
				
			// by search string
			filter = _.detect(cf, function(f){return f.key == "bandName";})
			if ( filter )
				caption += " matching " + filter.str;
		}							
		//return "&#9668;&nbsp; " + caption + " &nbsp;&#9658;";
		return "- " + caption + " -";
	}
});

//== Popup Form Base Class ====================================================================
/**
 * Popup for logging in
 */
VU.LoginPopupView = VU.PopupView.extend({
	popTemplate : "popupTemplate_login",

	getCaption: function() {
		return "Login";
	},
	
	onOpened : function() {
		if ( ! this.model.checkCookies() )
			alert("Please enable 3rd party cookies if you'd like to log in!");
			
		this.formView = new VU.FormView({el:this.el, model:this.model});
		this.formView.validate = this.validate;
		this.formView.processSuccessFail = this.processSuccessFail;
		this.formView.submit = this.submit;
	},
	
	onClosed : function() {
		this.formView.finalize();
		this.formView = null;
	},
	
    validate : function (data, callback) {
      if (!data.name || data.name.length == 0) {
        callback({name: "Please enter a name."});
        return false;
      };
	  if ( data.name.match(/([\w-+\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/g) == null ) {
		callback({name: "Must be a proper email address"});
		return false;
	  };
      if (!data.password || data.password.length == 0) {
        callback({password: "Please enter a password."});
        return false;
      };
      return true;
    },	
	
	processSuccessFail : function( errors, href ) {
		if ($.isEmptyObject(errors)) {
			if ( href )
				location.href = href;
			else
				location.href = "#///!";
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
		this.model.doLogin(data.name, data.password, callback);
		return false;
	}
});

/**
 * Popup for signing up
 */
VU.SignupPopupView = VU.LoginPopupView.extend({
	popTemplate : "popupTemplate_signup",

	getCaption: function() {
		return "Sign Up!";
	},
		
	submit : function ( data, callback ) {
		if (!this.validate(data, callback)) return;
		if ( data.password != data.password2 ) {
			callback({password2: "Passwords must match"});
			return false;
		}
		this.model.doSignup(data.name, data.password, function(errors){
			callback(errors, "#///member");
		});
	}
});

/**
 * Editing a profile...
 * We can safely assume that a user session exists when this is opened
 */
VU.EditPopupView = VU.LoginPopupView.extend({
	popTemplate : "popupTemplate_editMember",
	
	getCaption: function() {
		return "Edit Profile";
	},
	
	submit : function ( data, callback ) {
		this.model.doUpdate( data, callback );
	}
});

};