(function () {
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

//var PopupView = DustView.extend({

VU.BandView = VU.DustView.extend({
	el : $("#popup_block"), 
	initialize : function(){
		_.bindAll(this, 'render');
		this.model.bind('change', this.render);
		this.registerTemplate( "bandPopupTemplate" ); 
		//this.bandEventsView = new EventListView( { 
	},	
});

VU.HallView = VU.DustView.extend({
	el : $("#popup_block"), 
	initialize : function(){
		_.bindAll(this, 'render');
		this.model.bind('change', this.render);
		this.registerTemplate( "hallPopupTemplate" ); 
		//this.bandEventsView = new EventListView( { 
	},	
});

// The view for the primary event list container
VU.EventListView = Backbone.View.extend({
	el: $("#list"),
	nextY: 10,
	curDate: null,
	initialize : function(){
		_.bindAll(this, 'render', 'addRow');
		this.collection.bind("refresh", this.render);
		this.collection.bind("add", this.addRow);
		this.collection.bind("remove", this.deleted);
	},

	render: function(){
		if(this.collection.length > 0) this.collection.each(this.addRow);
	},
	
	// Appends an entry row 
	addRow : function(model){
		model.set( { "topY" : String(this.nextY) } );
		if ( model.get( "date" ) == this.curDate )
		{
			model.set( { "date" : "" } );
			this.nextY += 82;
		}
		else
		{
			this.curDate = model.get( "date" );
			this.nextY += 105;
		}
		var view = new EventEntryView( { model: model } );
		this.el.append( view.render().el );
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
		var address = hall.get( "address" );
		console.log("finding " + address );
		this.geocoder.geocode( { 'address': address}, this.attachToMap );
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
}).call(this);