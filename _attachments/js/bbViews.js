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
		if ( this.model.get( "onDCard" ) ) {
			$(".twostepphoto", this.el).addClass("active");
			$(".addToDanceCard", this.el).html("Remove<br/>From Card");
		} else {
			$(".twostepphoto", this.el).removeClass("active");
			$(".addToDanceCard", this.el).html("Add to<br/>Dance Card");
		}
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
		this.bootLoad = options.limit || 20;
		this.listingViews = {};
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
		
		this.collection.applyFilters( filters, limit || this.bootLoad );		
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
				this.collection.nextPage();
				this.scrollTo( attribute, startValue );
				return;
			}
			else
				index = this.collection.length - 1;
		}
		
		var listings = $(".listing", this.el);
		if ( listings.length < 2 ) return;
		var delta = listings[1].offsetTop - listings[0].offsetTop;
		this.el.scrollTop = (index - 1) * delta;
	},
	
	// for rendering colls that are already loaded (i.e. no add/remove listening)
	render : function() {
		//this.finalize();
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
		if ( _.size(this.listingViews) == this.collection.length ) 
			this.numPerPage = this.collection.length;
		if ( this.collection.length == 0 && !this.emptyEl ){
			this.emptyEl = $( this.emptyMsg );
			$(this.el).append( this.emptyEl );
		}
		this._updateSpacer();
	},
	
	// Adds a sorted row in its respective place in the DOM
	addRow : function(model, options){
		if ( this.emptyEl ){
			this.emptyEl.remove();
			this.emptyEl = null;
		}
		var lc, template = (this.el.getAttribute("listing-template") || "");
		if ( !template ) 
			console.log("listing-template attribute not given in " + this.el);
		else if ( model.id in this.listingViews )
			$(this.listingViews[model.id].el).css("display","block");
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
	},
	
	removeRow : function(model, options ){
		var lv = this.listingViews[model.id];
		if ( lv ) {
			$(lv.el).css("display","none");
			//if ( _.isFunction(lv.finalize()) )
				//lv.finalize();
			//else 
				//lv.remove();
			//delete this.listingViews[model.id];
		}
	},
	
	_updateSpacer : function () {
		var fullHeight = this.collection.fullLength * this.listingHeight;
		var dif = fullHeight - this.el.scrollHeight;
		var newSpacerHt = this.spacer.height() + dif;
		newSpacerHt < 1 && (newSpacerHt = 0);
		this.spacer.height( newSpacerHt );
		
		// if there's still some spacer left then that means we have more stuff to render,
		//	so hit up the next page (after some time...)
		if ( !this.collection.allPagesLoaded && !this.stID)// && this.spacer.position().top < $(this.el).height() )
			this.stID = setTimeout( this._nextPage, 500, 100 ) + "ID";
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
			//this._nextPage( );
		}else{
			utils.waitingUI.hide();
		}
	},
	
	_nextPage : function( limit ) {
		this.stID = false;
		this.collection.nextPage( limit );
		this._updateSpacer();
	}
});

/**
 * BASE CLASS View for a popup
 * instanciate once, use openPopup to open; it will close on its own
 * SubClasses MUST provide:
 * 		this.popTemplate
 *		this.getCaption
 **/
VU.PopupView = VU.DustView.extend({
	el : $("#popup_block"),
	
	// we want this to be static, so all use of it will refer to the prototype
	// in other words, only one popup can be active at once
	active : false,
	
	initialize : function ( ) {
		//Set up Close for Popup and Fade for all future instances
		_.bindAll(this, "closePopup", "render", "onOpened");
		
		// only needs to be set up once
		// TODO: refactor this to more appropriately use our current framework
		if ( !VU.PopupView.prototype.initialized ) {
			$('div.close_popup, #fade').live('click', this.closePopup );
			VU.PopupView.prototype.initialized = true;
		}
		this.registerTemplate( this.popTemplate );	
	},
	
	closePopup : function () {
		VU.PopupView.prototype.active = false;
		var fade = $('#fade , .popup_block');
		if ( fade && fade.length ) 
			fade.fadeOut('fast', null, function() {
				var fc = $('#fade, a.close');
				if ( fc && fc.length ) 
					fc.remove();
			});
			
		this.onClosed();
		window.location = "#///!";
		return false;		
	},
	
	render : function () {
		$(this.el).empty();
		VU.DustView.prototype.render.call(this);		
	},
	
	//stub; this should be extended for popup-type-specific captions
	getCaption : function () {
		return "";
	},
	
	getData : function() {
		var data = VU.DustView.prototype.getData.call(this);
		data.navCaption = this.getCaption();
		return data;
	},
	
	openPopup : function ( model ) {
		if ( model ) this.model = model;		
		VU.PopupView.prototype.active = true;

		// this will overwrite any existing popups
		this.render();
		//this.form.reset();  don't think we need this; when rendered the form starts clean		

		//Fade Background
		$('body').append('<div id="fade"></div>');
		//Fade in the fade layer - used to fix the IE Bug on fading transparencies 
		$('#fade').css({'filter' : 'alpha(opacity=80)'}).fadeIn('fast'); 

		//Fade Popup in and add close button
		this.el.fadeIn('fast', this.onOpened()).prepend('<div class="close_popup" title="Close Window"></div>');
		
		//this.onOpened();
		
		return false;
	},
	
	onOpened : function() {
		//stub; subclasses can extend this if they want
	},
	
	onClosed : function() {
		//stub; subclasses can extend this if they want
	}
	
});

VU.MapView = Backbone.View.extend({
	// static
	geocoder: new google.maps.Geocoder(),
	
	initialize : function( options ){
		_.bindAll( this, 'render', "addMarker", "removeMarker", "attachToMap" );
		this.masterColl = options.masterColl;		
		this.markers = {};
		this.gcs = {};
		this.addyOn = options.addressFallback;
		var center = new google.maps.LatLng(30.274338, -97.744675),
			myOptions = {
				zoom: 6,
				center: center,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			},
			that = this;
			
		this.map = new google.maps.Map(this.el, myOptions);

		if ( this.collection ){
			this.collection.bind("add", this.addMarker );
			this.collection.bind("refresh", this.render );
		}
		
		if ( this.masterColl ) {			
			this.masterColl.bind("add", function(model){that.addMarker(model,true)} );
			this.masterColl.bind("refresh", this.render );
			// remove events in collection mean add events here
			this.collection.bind("remove", function(model){that.addMarker(model,true)} );
		} else
			this.collection.bind("remove", this.removeMarker );
		
		//if collection already fetched then go ahead and render
		if ( ( this.masterColl && this.masterColl.fetched ) || 
			 ( this.collection.fetched ) ||
			 ( this.collection.masterCollection && this.collection.masterCollection.fetched ) )
			this.render();
	},

	render: function(){
		this.clearMarkers();
		
		// addMarker for all halls in filtered coll
		if ( this.collection.models.length > 0 )
			this.collection.each( this.addMarker );
			
		// addMarker for all halls in master Coll without filteredColl
		if ( this.masterColl ) {
			var filteredIDs = this.collection.pluck("hall");
			this.masterColl.each( function(hall){if ( filteredIDs.indexOf(hall.id) == -1 ) this.addMarker(hall, true);}, this );
		}
	},
	
	clearMarkers : function() {
		_.each( this.markers, function(m){m.setMap(null);});		
		this.markers = {};
	},
	
	removeMarker : function(m) {
		if ( m.id in this.markers )
			this.markers[m.id].setMap(null);
	},
	
	addMarker : function ( model, m ) {	
		var hallID = model.get("hall"), hall;
		if ( hallID )
			hall = model.collection.colls.halls.get( hallID );	
		hall && hall.unbind( "change", this.addMarker );
		
		// convert gps to LatLng
		var master = _.isBoolean(m) && m;
		var gps = model.get( "GPS Coordinates" ) || model.get( "gpsCoordinates" );			
		if ( gps ){
			gps = gps.replace(/(^\s*)|(\s*$)/g, "").split(" ");
			if ( gps.length < 2 ) 
				gps = gps[0].split(",");
			gps = gps.length > 1 ? new google.maps.LatLng( gps[1], gps[0] ) : null;
		}
		
		// see if there's a custom marker icon
		var markerURL = model.get( "styleMarker" );
		if ( markerURL )
			markerURL = "http://maps.google.com/mapfiles/ms/micons/" + markerURL + ".png";
		else
			markerURL = "http://maps.google.com/mapfiles/ms/micons/red-dot.png";
		
		// map it!
		if ( gps ) {
			var mOptions = {
				map: this.map, 
				position: gps,
				title: master ? null : model.get("danceHallName"),
				clickable : !master,
				icon: new google.maps.MarkerImage( 
					markerURL,
					master ? new google.maps.Size(15,9) : null,
					null, null, 
					master ? new google.maps.Size(15,15) : null 
				),
				zIndex : master ? -999 : 999
			};
			var modelID = model.id;
			if ( modelID in this.markers )
				this.markers[ modelID ].setOptions( mOptions );
			else {
				var marker = new google.maps.Marker( mOptions );
				this.markers[ modelID ] = marker;
				google.maps.event.addListener( marker, "click", function () { 
					location.href = "#///" + hall.collection.url + "&" + modelID; 
				});
			}
			
		//no gps, so let's try the address, on navColl halls only!
		} else if ( this.addyOn && !master && hall ) {
			var address = hall.get( "address" );
			if ( ! address )
				hall.bind( "change", this.addMarker );
			else {
				address = address.replace('\n', ' ');
				if ( !(address in this.gcs) ){
					console.log("[MapView] Attempting to find geocode for " + address);
					// HACK: using only the first 4 chars of addy, to give better chance of matchin properly-formatted addy in attachToMap
					this.gcs[address.substr(0,4)] = model;
					this.geocoder.geocode( { 'address': address}, this.attachToMap );
				}
			}
		}
	},
	
	attachToMap: function(results, status) {
		var model = this.gcs[ results[0].formatted_address.substr(0,4) ];
		if (status == google.maps.GeocoderStatus.OK) {
			var marker = new google.maps.Marker({
				map: this.map, 
				position: results[0].geometry.location
			});
			console.log("[MapView] Geocode found for " + results[0].formatted_address);
			if ( model )
				this.markers[ model.id ] = marker;
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
					this.tagsHash[tag] = this.tags.push( {text:tag, weight:1, url:"#////" + tag.replace("/","%2f")} ) - 1;
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
						filter.str = input.value.toLowerCase();
					else
						filters.push ({
							key: filterKey,
							str: input.value.toLowerCase()
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