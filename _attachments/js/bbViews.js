VU.InitViews = function () {
/////////////////////////////////////////////////////////////////////////////}
/// VIEWS DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
// This is the base class for any View using a dust template
VU.DustView = Backbone.View.extend({		
	registerTemplate : function(name) {
		// Relies on inline templates on the page
		dust.compileFn( $('#'+name).html() , name);
		this.template = name;
	},
	
	getData : function(){
		return this.model ? this.model.toJSON() : {};
	},
	
	render : function(){ 
		var result = '';
		dust.render(this.template, this.getData(), function (err,out) {
			if (err) result = err;
			else result = out;
		} );
		$(this.el).html(result);
		return this;
	}
});

// Represents an event entry in an event listing; is a dust template
VU.ListingView = VU.DustView.extend({
	// If there's a change in our model, rerender it
	initialize : function(){
		_.bindAll(this, 'render', 'empty');
		this.model.bind('change', this.render);
		this.registerTemplate( this.options.template );
	},
	
	empty : function() {
		this.model.unbind('change',this.render);
	},
	
	render : function() {
		//TODO: somehow incorporate this into the templating language		
		this.model.set( {
			name : window.utils.elipsesStr( this.model.get( "name" ), 18 ),
			entryDescription : window.utils.elipsesStr( this.model.get( "entryDescription" ), 180 )
		}, {silent:true});
		return VU.DustView.prototype.render.call(this);
	}
});	

// An extension of ListingView that simply updates the feet button
VU.EventListingView = VU.ListingView.extend({
	events : {
		"click .addToDanceCardDiv" : "toggleDCard"
	},
	
	initialize : function() {
		VU.ListingView.prototype.initialize.call(this);
		_.bindAll( this, "toggleDCard", "render" );
	},
	
	toggleDCard : function () {
		// checking BEFORE set...
		if ( this.model.get( "onDCard" ) ) {
			var shoes = $(".twostepphoto", this.el);
			if ( window.TDHP_tab == "DanceCard" )
				utils.flyAway( $(this.el), $("#dancesTabBtn") );
			else
				utils.flyAway( $("#dCardTabBtn"), shoes, shoes );
		} else
			utils.flyAway( $(".twostepphoto", this.el), $("#dCardTabBtn") );
		this.model.toggleDCard();
	},
	
	empty : function () {
		this.delegateEvents();
	},
	
	render : function () {
		VU.ListingView.prototype.render.call(this);
		// this is called AFTER the val is set
		if ( this.model.get( "onDCard" ) )
			$(".twostepphoto", this.el).addClass("active");
		else
			$(".twostepphoto", this.el).removeClass("active");
		return this;
	}		
});

// View for a collection of listings
VU.ListView = Backbone.View.extend({
	subViews : [],
	initialize : function( options ){
		_.bindAll(this, 'render', 'applyFilter', 'addRow', "reset");
		this.listingClass = options.listingClass || VU.ListingView;
		this.collection.bind("refresh", this.render);
		this.collection.bind("add", this.addRow);
		//TODO: attach scroll listener
	},
	
	applyFilter : function( filter ) {	
		utils.waitingUI.show();
		this.collection.applyFilter( filter, {success:function(){utils.waitingUI.hide()}, error:function(){utils.waitingUI.hide()}} );		
	},

	reset: function() {
		for ( var subView in this.subViews ){
			if (this.subViews[subView].empty) this.subViews[subView].empty();
			delete this.subViews[subView];
		}
		$(this.el).empty();
		this.render();
	},	
	
	render: function(){
		if (this.collection.length > 0) this.collection.each(this.addRow);
	},
	
	// Appends an entry row 
	addRow : function(model, options){
		var lc, template = (this.el.getAttribute("listing-template") || "");
		if ( !template ) 
			console.log("listing-template attribute not given in " + this.el);
		else {
			this.subViews.push (lc = new this.listingClass( {model: model, template: template} ));
			this.el.appendChild( lc.render().el );
			model.trigger("change", model);
		}
	},
	
	scrollUpdate : function () {
		//TODO: interpret scroll
		this.collection.loadMore();
	}
});

/**
 * View for a popup
 * instanciate once, use openPopup to open; it will close on its own
 * TODO: refactor this
 **/
VU.PopupView = VU.DustView.extend({
	el : $("#popup_block"),
	
	initialize : function ( options ) {
		//Set up Close for Popup and Fade for all future instances
		$('a.close, #fade').live('click', function() { //When clicked to close or fade layer...
			$('#fade , .popup_block').fadeOut(function() {
				$('#fade, a.close').remove();  //fade them both out
			});
			window.location = "#///!";
			return false;
		});		
	},
	
	render : function () {
		$(this.el).empty();
		VU.DustView.prototype.render.call(this);
		
		// if events exist in model then init the events-list view
		var list;
		if ( this.model ) list = this.model.get("events"); 
		if ( list ) {
			this.eventListView = new VU.ListView({ el:"#popuplist", collection:list });
			this.eventListView.render();
			this.miniMapView = new VU.MapView({collection: list, el: "#detailmap"});
		}
		this.delegateEvents({
			"click .nav-left" : "nav",
			"click .nav-right" : "nav"
		});
	},
	
	openPopup : function ( model, popTemplate ) {
		this.registerTemplate( popTemplate ); 
		this.model = model;
		this.render();
		
		//Fade Background
		$('body').append('<div id="fade"></div>');
		//Fade in the fade layer - used to fix the IE Bug on fading transparencies 
		$('#fade').css({'filter' : 'alpha(opacity=80)'}).fadeIn(); 

		//Fade Popup in and add close button
		this.el.fadeIn().prepend('<a href="#" class="close"><img src="images/button-x.png" width="21" border="0" class="close_popup" title="Close Window" alt="Close" /></a>');

		return false;
	},
	
	nav : function ( event ) {
		var coll = this.model.collection;
		if ( coll ){
			var index = coll.indexOf( this.model );
			if ( event.currentTarget.className == "nav-left" )
				index -= index > 0;
			else
				index += index < coll.length - 1;
			location.href="#///" + coll[index].id;
		}
	}
});

VU.MapView = Backbone.View.extend({
	map: null, 
	totalMapped: 0,
	geocoder: null,
	
	initialize : function(){
		_.bindAll(this, 'render', "addMarker", "attachToMap");
		var latlng = new google.maps.LatLng(30.274338, -97.744675);
		var myOptions = {
		  zoom: 6,
		  center: latlng,
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(this.el, myOptions);
		this.geocoder = new google.maps.Geocoder();
		
		//this.collection.bind("change", this.render);
		if ( this.collection ){
			this.collection.bind("add", this.addMarker );
			this.collection.bind("refresh", this.render );
			//this.collection.bind("reset", this.render );
			this.render();
		}
		else
			this.addMarker( this.model );
	},

	render: function(){
		// now add the first 10 markers
		//if(this.collection.length > 0) 
			//for ( var i = 0; i++ < 5; )
				//this.addMarker( this.collection.at(i) );
		if ( this.collection.models.length > 0 )
			this.collection.each( this.addMarker );
	},
	
	addMarker : function ( hall ) {
		// unbind, just in case came in from the else, below...
		hall.unbind( "change", this.addMarker );
		
		// try gps, first
		var gps = hall.get( "GPS Coordinates" ) || hall.get( "gpsCoordinates" );
		var title = hall.get("danceHallName");
		if ( gps ){
			gps = gps.split(" ");
			if ( gps.length < 2 ) 
				gps = gps[0].split(",");
			gps = gps.length > 1 ? new google.maps.LatLng( gps[1], gps[0] ) : null;
		}
		if ( gps ) {
			// TODO: if marker var needs to stay alive then put into hall model
			var marker = new google.maps.Marker({
				map: this.map, 
				position: gps,
				title: title
			});
			var hallID = hall.myType + "&" + hall.id;
			google.maps.event.addListener( marker, "click", function () { window.location = "#///" + hallID; } );
			
		} else {
			// now try its address instead
			var address = hall.get( "address" );
			if ( ! address )
				hall.bind( "change", this.addMarker );
			console.log("finding " + address );
			this.geocoder.geocode( { 'address': address}, this.attachToMap );
		}
	},
	
	attachToMap: function(results, status) {
		  if (status == google.maps.GeocoderStatus.OK) {
			var marker = new google.maps.Marker({
				map: this.map, 
				position: results[0].geometry.location
			});
		  } else {
			console.log("Geocode could not find address because: " + status);
		  }
	}	
});

VU.CalView = Backbone.View.extend({
	initialize : function() {
		$(this.el).multiDatesPicker();
	}
});

VU.ParentView = Backbone.View.extend({
	initialize : function() {
		_.bindAll( this, "activate", "deactivate" );
		this.colls = this.options.colls;
	},
	
	activate : function( filter ) {
		this.tabEl.addClass( "active-link" );
		this.el.show();
	},
	
	deactivate : function() {
		this.tabEl.removeClass( "active-link" );
		this.el.hide();
	}
});
//}
};