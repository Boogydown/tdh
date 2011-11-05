VU.InitPopupViews = function () {

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
	
	openPopup : function ( modelID, navColl ) {
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
			if ( this.navColl.model === VU.EventModel ){
				index = this.navColl.pluck( this.navPrefix ).indexOf( this.model.id );
				incDec();
				location.href="#///" + this.navPrefix + "&" + this.navColl.at(index).get( this.navPrefix );
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

//== Login Base Class ====================================================================
VU.LoginPopupView = VU.PopupView.extend({
	popTemplate : "popupTemplate_login",

	initialize : function() {
		VU.PopupView.prototype.initialize.call( this );
		_.bindAll( this, "submitPrep", "processSuccessFail" );
	},
	
	onOpened : function() {
		$("form", this.el).submit( this.submitPrep );
	},
		
	getCaption: function() {
		return "Login";
	},
	
	submitPrep : function(e) {
		e.preventDefault();
		var data = {};
		$.each($("form :input", this.el).serializeArray(), function(i, field) {
		  data[field.name] = field.value;
		});
		$("form :file", this.el).each(function() {
		  data[this.name] = this.value; // file inputs need special handling
		});
		this.submit(data, this.processSuccessFail);
	},
	
    validateUsernameAndPassword : function (data, callback) {
      if (!data.name || data.name.length == 0) {
        callback({name: "Please enter a name."});
        return false;
      };
      return this.validatePassword(data, callback);
    },

    validatePassword : function (data, callback) {
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
				this.closePopup();
		} else {
			var completeMsg = "";
			for (var name in errors) {
				completeMsg += name + ": " + errors[name] + "\n";
			}
			alert( completeMsg );
		}
	},
	
	submit : function(data, callback) {
		if (!this.validateUsernameAndPassword(data, callback)) return;
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
	
	initialize : function() {
		VU.LoginPopupView.prototype.initialize.call( this );
		this.delegateEvents( {"change :file": "addAttachment"} );
	},
	
	onOpened : function() {
		VU.LoginPopupView.prototype.onOpened.call(this);
		this.model.bind( "change", this.render );
	},
	
	onClosed : function() {
		VU.LoginPopupView.prototype.onClosed.call(this);
		this.model.unbind( "change", this.render );
	},
		
	addAttachment : function ( e ) {
		var form = e.target.form;
		var model = this.model;
		$("#main-photo", this.el).html("<div class='spinner' style='top:45px;left:75px;position:relative;'></div>");
		var picFile = form._attachments.value.match(/([^\/\\]+\.\w+)$/gim)[0];
		model.set( {profilePic: picFile}, {silent:true} );
		$(form).ajaxSubmit({
			url:  "/_users" + (model.id ? "/" + model.id : ""),
			success: function(resp) {
				// strip out <pre> tags
				var json = JSON.parse(resp = resp.replace(/\<.+?\>/g,''));
				if ("ok" in json) {
					// update our form;
					form._rev.value = json.rev;
					form.profilePic.value = picFile;
					//model.set( { id: json.id } ); don't need this since we aren't allowing pic upload on signup
					
					// this will allow us to grab the updated _attachments signature from couch so we can save() later
					model.fetch({silent:true, success: function() {
						$("#main-photo",model.el).html('<img src="/_users/' + model.id + '/' + picFile + '"/>' );
					}} );
				}
				else 
					alert("Upload Failed: " + resp);
			}
		});
	},
		
	submit : function ( data, callback ) {
		this.model.doUpdate( data, callback );
	},
	
	editSaveSuccess : function () {
		location.href = "#///!";
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
		}		
		return data;
	}
});

};