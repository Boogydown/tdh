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
		_.bindAll(this, 'render', 'finalize');
		this.model.bind('change', this.render);
		this.registerTemplate( this.options.template );
	},
	
	finalize : function() {
		this.model.unbind('change',this.render);
		this.remove();
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

/**
 * This view is intended for wrapping a filtered list (LocalFilteredCollection)
 *  It is intended to only increase or decrease its contents, with refreshes
 *	being very rare.  Thus, it listenes to Add and Remove events on the filtered
 *	list
 */
 VU.FilteredListView = Backbone.View.extend({
	scrollLoadThreshold : 100,
	LISTING_HEIGHT: 92,
	
	events : { 
		"scroll" : "scrollUpdate" 
	},
	
	initialize : function( options ) {
		_.bindAll(this, 'addRow', "removeRow", "scrollUpdate", "filtered", "_nextPage", "_updateSpacer");
		this.emptyMsg = options.emptyMsg || "<i>This list is empty</i>";
		this.listingClass = options.listingClass || VU.ListingView;
		this.pageLimit = options.limit || 20;
		this.listingViews = [];
		this.listingHeight = options.listingHeight || this.LISTING_HEIGHT;
		this.collection.bind("add", this.addRow);
		this.collection.bind("remove", this.removeRow);
		this.collection.bind("filtered", this.filtered);
		$(this.el).append("<div id='spacer' style='height:1px'></div>");
		this.spacer = $("#spacer",this.el);
	},
	
	// This will apply filters to the coll and trigger add/remove events, 
	//	respectively, which will then trigger our add/remove rows
	applyFilters : function( filters, limit ) {
		if ( this.collection.length == 0 ){
			//this.el.innerHTML = "";
			utils.waitingUI.show();
		}
		
		this.collection.applyFilters( filters, limit || this.pageLimit );		
	},
	
	// scrolls the listing to the first model of attribute >= startValue, or 
	//	the last model, whichever is first
	// Assumes this.collection is sorted by that attribute
	scrollTo : function( attribute, startValue ) {
		var firstModel = this.collection.find( function( model ){ return model.attributes[attribute] >= startValue; } ),
			index;
		if ( firstModel )
			index = this.collection.indexOf( firstModel );
		else {
			if ( ! this.collection.allPagesLoaded ) {
				this.collection.nextPage( this.pageLimit );
				this.scrollTo( attribute, startValue );
				return;
			}
			else
				index = this.collection.length - 1;
		}
		
		var listings = $("#listing", this.el);
		if ( listings.length < 2 ) return;
		var delta = listings[1].offsetTop - listings[0].offsetTop;
		this.el.scrollTop = (index - 1) * delta;
	},
	
	// for rendering colls that are already loaded (i.e. no add/remove listening)
	render : function() {
		var addRow = this.addRow;
		this.collection.each( function (model){ 
			addRow( model ); 
		});
	},

	finalize : function() {
		for ( var subView in this.listingViews ){
			if (_.isFunction(this.listingViews[subView].finalize)) this.listingViews[subView].finalize();
			delete this.listingViews[subView];
		}
		$(this.el).empty();
	},	
	
	// called once, after all add/remove callbacks have been processed
	filtered : function() {
		//if ( this.collection.length == 0 )
			//this.el.innerHTML = this.emptyMsg;		
		//utils.waitingUI.hide();	
		this._updateSpacer();
	},
	
	// Adds a sorted row in its respective place in the DOM
	addRow : function(model, options){		
		var lc, template = (this.el.getAttribute("listing-template") || "");
		if ( !template ) 
			console.log("listing-template attribute not given in " + this.el);
		else {
			this.listingViews[model.id] = lc = new this.listingClass( {model: model, template: template} );
			lc = lc.render().el;
			if ( this.el.childNodes.length > model.index + 1 ) //+1 for the spacer
				$(this.el.childNodes[ model.index ]).before( lc );
			else 
				//this.el.appendChild( lc );
				this.spacer.before( lc );
			//model.trigger("change", model);
		}
		//this._updateSpacer();
	},
	
	removeRow : function(model, options ){
		var lv = this.listingViews[model.id];
		if ( lv ) {
			if ( _.isFunction(lv.finalize()) )
				lv.finalize();
			else 
				lv.remove();
			delete this.listingViews[model.id];
		}
		//this._updateSpacer();
	},
	
	_updateSpacer : function () {
		var fullHeight = this.collection.fullLength * this.listingHeight;
		var dif = fullHeight - this.el.scrollHeight;
		var newSpacerHt = this.spacer.height() + dif;
		newSpacerHt < 1 && (newSpacerHt = 0);
		this.spacer.height( newSpacerHt );
		
		// if there's still some spacer left then that means we have more stuff to render,
		//	so hit up the next page (after some time...)
		if ( newSpacerHt && this.spacer.position().top < $(this.el).height() )
			setTimeout( this._nextPage, 1200, 80 );
		else
			utils.waitingUI.hide();
	},
	
	scrollUpdate : function () {
		//if scrolling to the bottom then load some more stuff
		//if ( this.el.scrollTop >= (this.el.scrollHeight - this.el.clientHeight - this.scrollLoadThreshold ) )
			//this._nextPage();
			
		//if scrolling down and see spacer then load some more stuff			
		if ( this.spacer.position().top < $(this.el).height() ){
			utils.waitingUI.show();
			this._nextPage( );
		}
	},
	
	_nextPage : function( limit ) {
		this.collection.nextPage( limit || this.pageLimit );
		this._updateSpacer();
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
			$('#fade , .popup_block').fadeOut('fast', null, function() {
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
			(this.eventlistView = new VU.FilteredListView({
				el:"#popuplist",
				emptyMsg: "<i>No upcoming dances scheduled</i>",
				listingClass:VU.EventListingView,
				collection: list
			})).render();
			this.miniMapView = new VU.MapView({collection: list, el: "#detailmap"});
			
		}
		this.delegateEvents({
			"click #nav-left" : "nav",
			"click #nav-right" : "nav"
		});
	},
	
	openPopup : function ( model, popTemplate, navColl, navCaption ) {
		this.registerTemplate( popTemplate ); 
		this.model = model;
		if ( this.model )
			this.model.set({
				navCaption: "&#9668;&nbsp; " + navCaption + " &nbsp;&#9658;"
			});
		this.navColl = navColl;
		this.render();
		
		//Fade Background
		$('body').append('<div id="fade"></div>');
		//Fade in the fade layer - used to fix the IE Bug on fading transparencies 
		$('#fade').css({'filter' : 'alpha(opacity=80)'}).fadeIn('fast'); 

		//Fade Popup in and add close button
		this.el.fadeIn('fast').prepend('<a href="#" class="close"><img class="close_popup" title="Close Window" /></a>');

		return false;
	},
	
	nav : function ( event ) {
		var coll = this.navColl;
		if ( coll ){
			var index = coll.indexOf( this.model );
			if ( event.target.id == "nav-left" )
				index -= index > 0;
			else
				index += index < coll.length - 1;
			location.href="#///" + this.model.myType + "&" + coll.at(index).id;
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
			//this.render();
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
			else
				this.geocoder.geocode( { 'address': address}, this.attachToMap );
		}
	},
	
	attachToMap: function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var marker = new google.maps.Marker({
				map: this.map, 
				position: results[0].geometry.location
			});
			console.log("Geocode found for " + results[0].formatted_address);
		}
	}	
});

VU.CalView = Backbone.View.extend({
	initialize : function() {
		_.bindAll( this, "updateDateRoute" );
		$(this.el).datepicker({
			onSelect: this.updateDateRoute,
			minDate: "-2D", // start at two days in the past, per client request
			defaultDate: "-2D",
			dateFormat: "@" // unix time
		});
	},
	
	updateDateRoute : function ( dateText, inst ) {
		if ( dateText )
			location.href = "#/" + dateText;
		else
			location.href = "#/!";
	}
});

VU.TagCloudView = Backbone.View.extend({
	initialize : function() {
		_.bindAll( this, "render", "addTags", "removeTags" );
		this.tags = [];
		this.tagsHash = [];
		this.collection.bind( "refresh", this.render );
	},
	
	render : function( ) {
		// wait until coll is fully fetched
		if ( ! this.collection.fetched ) return;
		
		// TODO: turn this into a map/reduce view off of the db:
		this.tags = [{text:"ALL", weight:10, url:"#////!"}];
		this.tagsHash = [];
		var colltags = this.collection.pluck( "stylesPlayed" ),
			i, j;
		for ( i in colltags )
			for ( j in colltags[i] ) {
				tag =  colltags[i][j];
				if ( tag in this.tagsHash )
					this.tags[this.tagsHash[tag]].weight++;
				else
					this.tagsHash[tag] = this.tags.push( {text:tag, weight:1, url:"#////" + tag} ) - 1;
			}
		$(this.el).empty();
		$(this.el).jQCloud( this.tags );
	},
	
	addTags : function( model ){
	},
	
	removeTags : function( model ){
	}
});

VU.ParentView = Backbone.View.extend({
	initialize : function() {
		_.bindAll( this, "activate", "deactivate" );
		this.colls = this.options.colls;
		this.active = false;
	},
	
	activate : function( filter ) {
		if ( this.active ) return;
		this.tabEl.addClass( "active-link" );
		this.el.show();
		this.active = true;
	},
	
	deactivate : function() {
		if ( ! this.active ) return;
		this.tabEl.removeClass( "active-link" );
		this.el.hide();
		this.active = false;
	}
});

VU.SearchBoxView = Backbone.View.extend({
	events : {
		"focus" : "handleSearch",
		"blur" : "handleSearch",
		"keyup" : "handleSearch",
		"change" : "handleSearch"
	},
	
	initialize : function(options) {
		_.bindAll( this, "handleSearch" );
		this.defaultSearchVal = $(this.el)[0].value;
		this.filterKey = options.filterKey;
	},
	
	handleSearch : function( searchField ) {
		var input = searchField.target;
		console.log(searchField.type);
		switch ( searchField.type ) {
			case "focusout" : 
			case "blur" : 
				if ( input.value == "" ) input.value = this.defaultSearchVal;
				break;
			case "focusin" : 
			case "focus" : 
				if ( input.value == this.defaultSearchVal ) input.value = "";
				break;
			case "change" :
			case "keyup" : 
				//this.listView.scrollTo( "bandName", searchField.target.value );
				
				// find my bandName filter and either remove it (str=="") or replace it with new search
				var filters = this.model.collection.currentFilters || [];
				var filterKey = this.filterKey;
				if ( input.value == "" ) {
					if ( filters.length > 0 )
						this.model.collection.currentFilters = _.reject(filters, function(f){return f.key==filterKey});
				} else {
					var filter = _.detect(filters, function(f){return f.key == filterKey;})
					if ( filter )
						filter.str = input.value;
					else
						filters.push ({
							key: filterKey,
							str: input.value
						});
				}
				
				this.model.applyFilters();
				console.log(input.value);
				break;
		}
	}
});
//}
};