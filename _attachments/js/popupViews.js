VU.InitPopupViews = function () {

VU.SchemaFormEventView = VU.PopupView.extend({
	popTemplate : "popupTemplate_addEvent2",
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
			schemaName : "full",
			schema : VU.schemas.events.full,
			docID : this.modelID,
			hidden : true
		});
	},
	
	onClosed : function() {
		this.sF.finalize();
		this.sF = null;
	}
});	

VU.SchemaFormHallView = VU.PopupView.extend({
	popTemplate : "popupTemplate_addEvent2",
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
	
VU.SchemaFormBandView = VU.PopupView.extend({
	popTemplate : "popupTemplate_addEvent2",
	getCaption: function() {
		return "Edit Band";
	},
	
	onOpened : function() {
		if ( this.modelID )
			this.sF = new VU.SchemaFormView({
				el : $("#model_edit"),
				collName : "bands",
				collection : this.options.colls.bands,
				schemaName : "full",
				schema : VU.schemas.bands.full,
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
			owns = [], i = 0,
			e = data.owns.events, el = e.length,
			v = data.owns.vyntors, vl = v.length;
		if ( el || vl ) {
			var maxLen = Math.max(el, vl);
			for ( ;i < maxLen; i++ ){
				owns.push({ 
					event: i < el ? e[i] : null,
					vyntor: i < vl ? v[i] : null
				});
			}
			data.owns = owns;
			if ( vl ) data.ownsVyntor = true;
		}		
		return data;
	}
});

//== Events Container Base Class ====================================================================
VU.EventsContainerPopupView = VU.PopupView.extend({
	events : {
		"click #nav-left" : "nav",
		"click #nav-right" : "nav"
	},
	
	// initialize must be extended to load this.collection
	initialize : function ( options ) {
		_.bindAll( this, "_modelLoaded", "nav", "onOpened" );
		this.colls = options.colls;
		VU.PopupView.prototype.initialize.call( this, options );
	},
	
	openPopup : function ( mySession, modelID, navColl, popAry ) {
		this.ncIndex = popAry.length > 1 ? parseInt(popAry[2]) : null;
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
		_.defer( function() {
			that.miniMapView = new VU.MapView({collection: that.list, el: $("#detailmap",that.el).get(0), addressFallback: true});
		});
	},
	
	nav : function ( event ) {
		// navcoll is used to get the next/prev index... but we're still going to pull from this.collection
		var coll = this.navColl, id;
		if ( coll ){
			var index, incDec = function(){
				if ( event.target.id == "nav-left" )
					index = index > 0 ? index - 1 : coll.length - 1;
				else
					index = index < coll.length - 1 ? index + 1 : 0;
			};
			
			//TODO: for events, its index is the index of its element
			if ( this.navColl.model === VU.EventModel ){
				index = this.ncIndex ? this.ncIndex : _(this.navColl.pluck( this.navPrefix )).indexOf( this.model.id );
				incDec();
				location.href="#///" + this.navPrefix + "&" + this.navColl.at(index).get( this.navPrefix ) + "&" + index;
			}
			else {
				index = this.navColl.indexOf( this.model );
				incDec();
				location.href="#///" + this.navPrefix + "&" + this.navColl.at(index).id;
			}
		}
	}	
});

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
VU.LoginPopupView = VU.PopupView.extend({
	popTemplate : "popupTemplate_login",

	getCaption: function() {
		return "Login";
	},
	
	onOpened : function() {
		this.formView = new VU.FormView({el:this.el, model:this.model});
		this.formView.validate = this.validate;
		this.formView.processSuccessFail = this.processSuccessFail;
		this.formView.submit = this.submit;
	},
	
	onClosed : function() {
		this.formView.finalize();
		this.formView = null;
	},
	
	//override
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
	
	//override
	processSuccessFail : function( errors, href ) {
		if ($.isEmptyObject(errors)) {
			if ( href )
				location.href = href;
			else
				this.closePopup();
		} else {
			var completeMsg = "";
			for (var name in errors) {
				completeMsg += name + ": " + errors[name] + "\n";
			}
			alert( completeMsg );
		}
	},
	
	//override
	submit : function(data, callback) {
		if (!this.validate(data, callback)) return;
		this.model.doLogin(data.name, data.password, callback);
		return false;
	}
});

VU.SignupPopupView = VU.LoginPopupView.extend({
	popTemplate : "popupTemplate_signup",

	getCaption: function() {
		return "Sign Up!";
	},
		
	submit : function ( data, callback ) {
		if (!this.validateUsernameAndPassword(data, callback)) return;
		if ( data.password != data.password2 ) {
			callback({password2: "Passwords must match"});
			return false;
		}
		this.model.doSignup(data.name, data.password, function(errors){
			callback(errors, "#///member");
		});
	}
});

// Editing a profile...
//	We can safely assume that a user session exists when this is opened
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