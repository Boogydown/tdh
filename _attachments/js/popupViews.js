VU.InitViews = function () {

VU.AddEventPopupView = VU.PopupView.extend({
	popTemplate : "popupTemplate_addEvent",
	getCaption: function() {
		return "Add event";
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
		_.bindAll( this, "_modelLoaded" );
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
		
		this.miniMapView = new VU.MapView({collection: this.list, el: "#detailmap"});		
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
				location.href="#///" + this.navPrefix + "&" + this.collection.at(index).id;
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
		//TODO: customize this to the current filter
		return "&#9668;&nbsp; All Dancehalls &nbsp;&#9658;";
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
		//TODO: customize this to the current filter
		return "&#9668;&nbsp; All Bands &nbsp;&#9658;";
	}	
});

//== Login Base Class ====================================================================
VU.LoginPopupView = VU.PopupView.extend({
	popTemplate : "popupTemplate_login",
	getCaption: function() {
		return "Login";
	}
});

VU.SignupPopupView = VU.LoginPopupView.extend({
	popTemplate : "popupTemplate_signup",
	getCaption: function() {
		return "Sign Up!";
	}
});

VU.EditPopupView = VU.SignupPopupView.extend({
	popTemplate : "popupTemplate_editMember",
	getCaption: function() {
		return "Edit Profile";
	}
});

};