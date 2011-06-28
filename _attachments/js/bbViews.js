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
		return this.model.toJSON();
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
VU.EventEntryView = VU.DustView.extend({

	// Clicking the feet adds it to the dance card
	events : {
		"click .feet" : "addToDanceCard",
	},
	
	// If there's a change in our model, rerender it
	initialize : function(){
		_.bindAll(this, 'render', "addToDanceCard");
		this.model.bind('change', this.render);
		this.registerTemplate('mainEventEntryTemplate');
	},
	
	// Adds this event to the danceCard collection
	addToDanceCard : function(){
		// nothing here, yet
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
			window.location = window.location.href.split("#")[0] + "#";
			return false;
		});		
	},
	
	render : function () {
		VU.DustView.prototype.render.call(this);
		var events;
		if ( this.model ) events = this.model.get("events"); 
		if ( events ) {
			this.eventListView = new VU.EventListView({ el:$("#popuplist"), collection:events });
			this.eventListView.render();
		}
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
	}
});
	

// The view for the primary event list container
VU.EventListView = Backbone.View.extend({
	el: $("#list"),
	initialize : function(){
		_.bindAll(this, 'render', 'addRow');
		this.collection.bind("refresh", this.render);
		//this.collection.bind("add", this.addRow);
		this.collection.bind("remove", this.deleted);
	},

	render: function(){
		if (this.collection.length > 0) 
			this.collection.each(this.addRow);
	},
	
	// Appends an entry row 
	addRow : function(model){
		this.el.append( new VU.EventEntryView( { model: model } ).render().el );
		model.trigger("add");
	}
});

VU.MapView = Backbone.View.extend({
	el: $("#main-map"),
	map: null, 
	totalMapped: 0,
	geocoder: null,
	
	initialize : function(){
		_.bindAll(this, 'render', "addChange", "addMarker", "attachToMap");
		var latlng = new google.maps.LatLng(30.274338, -97.744675);
		var myOptions = {
		  zoom: 6,
		  center: latlng,
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(document.getElementById("main-map"), myOptions);
		this.geocoder = new google.maps.Geocoder();
		
		//this.collection.bind("change", this.render);
		this.collection.bind("add", this.addChange );
		//this.collection.bind("remove", this.deleted);
	},

	render: function(){
		//
		// now add the first 10 markers
		//if(this.collection.length > 0) 
			//for ( var i = 0; i++ < 5; )
				//this.addMarker( this.collection.at(i) );
	},
	
	addChange: function( hall ) {
		hall.bind( "change" , this.addMarker );
	},
	
	// TODO: if marker var needs to stay alive then put into hall model
	addMarker : function ( hall ) {
		var gps = hall.get( "GPS Coordinates" );
		if ( gps )
		{
			gps = gps.split(",");
			gps = gps.length() > 1 ? new google.maps.LatLng( gps[0], gps[1] ) : null;
		}
		if ( gps )
			var marker = new google.maps.Marker({map: this.map, position: gps });
		else{
			var address = hall.get( "address" );
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
};