VU.InitViews = function () {
/////////////////////////////////////////////////////////////////////////////}
/// VIEWS DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
/**
 * This is the base class for any View using a dust template
 * Subclasses must registerTemplate() before rendering
 */
VU.DustView = Backbone.View.extend({
	compiledTemplates : {},
	
	/**
	 * Should call this in initialize.  This will compile the template
	 *
	 * @param (string) name ID of the template
	 */
	registerTemplate : function(name) {
		var templates = VU.DustView.prototype.compiledTemplates,
			th = (this.templateEl = $("#" + name)).html();
		this.template = name;
		if ( !(name in templates) ){
			dust.compileFn( th , name);
			templates[name] = th;
		}
	},
	
	/**
	 * Override this as you see fit to customize your data parsing
	 *	Parses the current model's values
	 *
	 * @return (object) The JSON-compatible object that the template will parse
	 */
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

/**
 * Represents a single event entry in list of events
 * Processes limits on long text and also has generic finalize
 */
VU.ListingView = VU.DustView.extend({
	initialize : function(){
		_.bindAll(this, 'render', 'finalize');
		// If there's a change in our model, rerender it
		this.model.bind('change', this.render);
		this.registerTemplate( this.options.template );
		
		// find the text limits, if any
		var textLimits = $("#" + this.options.template).attr("textLimits"),
			i, limitPair;
		if ( textLimits ){
			textLimits = textLimits.split(";");
			for ( var i in textLimits ){
				limitPair = textLimits[i].split(":");
				if ( limitPair.length > 1 )
					textLimits[i] = {
						datum: limitPair[0],
						limit: limitPair[1]
					};
			}
			this.textLimits = textLimits;
		}
	},
	
	finalize : function() {
		this.model.unbind('change',this.render);
		this.remove();
	},
	
	getData : function() {
		var data = this.model.toJSON(), datum, limit, i;
		for ( i in this.textLimits ) {
			datum = this.textLimits[i].datum;
			limit = parseInt(this.textLimits[i].limit);
			if ( datum in data )
				data[datum] = window.utils.elipsesStr( this.model.get( datum ), limit );
		}
		return data;
	},
	
	setImg : function( src ) {
		if ( !this._img ) 
			this._img = $("img",$(this.el));
		this._img.attr( "src", src );
	}
});	

/**
 * An extension of ListingView that simply updates the feet button
 * ("Add to dance card") and handles its animation
 */
VU.EventListingView = VU.ListingView.extend({
	events : {
		"click .addToDanceCardDiv" : "toggleDCard"
	},
	
	initialize : function(options) {
		this.listOf = options && options.listOf;
		VU.ListingView.prototype.initialize.call(this);
		_.bindAll( this, "toggleDCard", "render", "getData" );
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
	},
	
	getData : function() {
		var data = VU.ListingView.prototype.getData.call(this);
		if ( this.listOf == "band" )
			data.tab = window.TDHP_tab == "Bands" ? "Halls" : window.TDHP_tab;
		else if ( this.listOf == "hall" )
			data.tab = window.TDHP_tab == "Halls" ? "Bands" : window.TDHP_tab;
		if ( data.admission == "$" ) data.admission = "";
		return data;
	}		
});

/**
 * This view is intended for wrapping a filtered list (LocalFilteredCollection)
 *  It is intended to only increase or decrease its contents, with resets
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
		this.options = options;
		this.listingHeight = options.listingHeight || this.LISTING_HEIGHT;
		if ( !(this.template = (this.el.getAttribute("listing-template") || "")))
			utils.logger.log("listing-template attribute not given in " + this.el);		
		this.collection.bind("add", this.addRow);
		this.collection.bind("remove", this.removeRow);
		this.collection.bind("filtered", this.filtered);
		$(this.el).append("<div id='spacer' style='height:1px'></div>");
		this.spacer = $("#spacer",this.el);
	},
	
	/**
	 * This will apply filters to the collection and trigger add/remove events, 
	 *	respectively, which will then trigger our add/remove rows
	 * 
	 * @param (array) filters Filters array, as assembled by AppController
	 * @param (number) limit How many to limit our results to?
	 */
	applyFilters : function( filters, limit ) {
		this.firstRow = true;
		if ( this.collection.length == 0 )
			utils.waitingUI.show();
		
		this.collection.applyFilters( filters, limit || this.bootLoad );		
	},
	
	/** 
	 * Scrolls the listing to the first model of attribute >= startValue, or 
	 *	the last model, whichever is first
	 * Assumes this.collection is sorted by that attribute
	 *
	 * @param (string) attribute Name of model's attribute to look through
	 * @param startValue 
	 */
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
		
		this.el.scrollTop = (index - 1) * this.getListingHeight();
	},
	
	getListingHeight : function() {
		if ( this.listingHeight )
			return this.listingHeight;
		var listings = $(".listing", this.el);
		if ( listings.length < 2 ) return;
		this.listingHeight = listings[1].offsetTop - listings[0].offsetTop;		
	},
	
	/**
	 * For rendering colls that are already loaded (i.e. no add/remove listening)
	 * 	This is rarely used.
	 */
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
	
	/**
	 * Called once, after all add/remove callbacks have been processed
	 */
	filtered : function() {
		if ( _.size(this.listingViews) == this.collection.length ) 
			this.numPerPage = this.collection.length;
		if ( this.collection.length == 0 && !this.emptyEl ){
			this.emptyEl = $( this.emptyMsg );
			$(this.el).append( this.emptyEl );
		}
		this._updateSpacer();
		this.scrollUpdate();
	},
	
	/**
	 * Adds a sorted row in its respective place in the DOM
	 * 	(or just make it visible, if already there)
	 *
	 * @param (Model) model The model that was added
	 * @param (object) options The passthrough options object (via backbone)
	 */
	addRow : function(model, options){
		if ( this.firstRow ) {
			if ( this.emptyEl ){
				this.emptyEl.remove();
				this.emptyEl = null;
			}
			utils.waitingUI.hide();
			this.firstRow = false;
		}
		
		var lc;
		if ( model.id in this.listingViews )
			$(this.listingViews[model.id].el).css("display","block");
		else {
			this.listingViews[model.id] = lc = new this.listingClass({
				model: model, 
				template: this.template,
				listOf: this.options.navPrefix
			});
			lc = lc.render().el;
			if ( this.el.childNodes.length > model.index )//+ 1 ) //+1 for the spacer
				$(this.el.childNodes[ model.index ]).before( lc );
			else 
				//this.spacer.before( lc );
				this.el.appendChild( lc );
		}
	},
	
	/**
	 * Removes a row from the DOM
	 * 	Well... actually we just hide it because it's expensize to remove/redraw
	 *
	 * @param (Model) model The model that was removed
	 * @param (object) options The passthrough options object (via backbone)
	 */
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
		/* killing spacer for now
		var fullHeight = this.collection.fullLength * this.listingHeight;
		var dif = fullHeight - this.el.scrollHeight;
		var newSpacerHt = this.spacer.height() + dif;
		newSpacerHt < 1 && (newSpacerHt = 0);
		this.spacer.height( newSpacerHt );
		*/
		
		// if there's still some spacer left then that means we have more stuff to render,
		//	so hit up the next page (after some time...)
		if ( !this.collection.allPagesLoaded && !this.stID)// && this.spacer.position().top < $(this.el).height() )
			this.stID = setTimeout( this._nextPage, 500, 100 ) + "ID";
		//else
			//utils.waitingUI.hide();
	},
	
	scrollUpdate : function () {
		//if scrolling to the bottom then load some more stuff
		//if ( this.el.scrollTop >= (this.el.scrollHeight - this.el.clientHeight - this.scrollLoadThreshold ) )
			//this._nextPage();
			
		//if scrolling down and see spacer then load some more stuff
/*		if ( this.spacer.position().top < $(this.el).height() ){
			utils.waitingUI.show();
			//this._nextPage( );
		}else{
			utils.waitingUI.hide();
		}
*/
		// call setVisible() on all items in the scroll window plus 4 before and 4 after
		var delta = this.getListingHeight();
		var visibleListingIndex = Math.floor(this.el.scrollTop / delta) - 4;
		var model;
		while ( (visibleListingIndex - 4) * delta < this.el.scrollTop + this.el.clientHeight ) {
			model = this.collection.at( visibleListingIndex );
			//if ( model && model.cachedThumb )
				//this.listingViews[model.id].setImg( model.cachedThumb );
			if ( model && model.setVisible )
				model.setVisible();
			
			visibleListingIndex++;
		}
	},
	
	/**
	 * Load the next page
	 *
	 * @param (number) limit The number of models to load for this page
	 */
	_nextPage : function( limit ) {
		this.stID = false;
		this.collection.nextPage( limit );
		this._updateSpacer();
	}
});

/**
 * BASE CLASS View for a popup
 * Instanciate ONLY ONCE for entire app!  Only one popup at a time.
 * Use openPopup to open; it will close on its own
 * SubClasses MUST provide:
 * 		this.popTemplate
 *		this.getCaption
 **/
VU.PopupView = VU.DustView.extend({
	el : $("#popup_content"),
	
	/**
	 * We want this to be static, so all use of it will refer to the prototype
	 * in other words, only one popup can be active at once
	 */
	active : false,
	
	initialize : function ( options ) {
		//Set up Close for Popup and Fade for all future instances
		_.bindAll(this, "closePopup", "render", "onOpened", "onClosed" );
		this.colls = options ? options.colls : null;
		this.registerTemplate( this.popTemplate );	
		$('#close_popup, #fade').click( function(){location.href="#///!";} );
	},
	
	render : function () {
		this.el.empty();
		VU.DustView.prototype.render.call(this);		
	},
	
	/**
	 * Stub; this should be extended for popup-type-specific captions
	 *  that appear in the popup's title bar
	 *
	 * @return (string) Popup's title
	 */
	getCaption : function () {
		return "";
	},
	
	getData : function() {
		var data = VU.DustView.prototype.getData.call(this);
		data.navCaption = this.getCaption();
		return data;
	},
	
	/**
	 * Open the popup!
	 *
	 * @param (MemberModel) mySession The current session
	 * @param (string) modelID ID of the model to show in this popup
	 * @param (FilteredList) navColl The collection to iterate over when navigating left/right on the popup nav arrows
	 * @param (array) popAry The full array of parameters passed from the URL to this popup
	 */
	openPopup : function ( mySession, modelID, navColl, popAry ) {
		this.params = popAry;
		this.model = this.mySession = mySession;
		this.modelID = modelID;
		VU.PopupView.prototype.active = this;

		// this will overwrite any existing popups
		this.render();
		//this.form.reset();  don't think we need this; when rendered the form starts clean		

		//Fade in the fade layer - used to fix the IE Bug on fading transparencies 
		$('#fade').css({'filter' : 'alpha(opacity=80)'}).fadeIn('fast'); 

		//Fade Popup in and add close button
		$("#popup_block").fadeIn('fast', this.onOpened);
		
		return false;
	},
	
	/**
	 * Will close and tear-down the popup
	 */
	closePopup : function () {
		var currentPop = VU.PopupView.prototype.active,
			fade = $('#fade'),
			pb = $('#popup_block');
		VU.PopupView.prototype.active = null;
		VU.PopupView.prototype.previous = currentPop;
		pb && pb.fadeOut('fast', null, function() {
			});
		fade && fade.fadeOut('fast', function() {
				location.href = "#///!";				
				currentPop.onClosed();
			});
		return false;		
	},	

	/**
	 * An overridable callback that is called after the popup opens
	 */
	onOpened : function() {
		//stub; subclasses can extend this if they want
	},
	
	/**
	 * An overridable callback that is called after the popup closes
	 */
	onClosed : function() {
		//stub; subclasses can extend this if they want
	}
});

/**
 * A view for displaying a Google map
 */
VU.MapView = Backbone.View.extend({
	// static
	geocoder: new google.maps.Geocoder(),
	
	initialize : function( options ){
		_.bindAll( this, 'render', "addMarker", "removeMarker", "attachToMap", "fitBounds" );
		this.masterColl = options.masterColl;		
		this.clearMarkers();
		this.gcs = {};
		this.addyOn = options.addressFallback;
		var center = new google.maps.LatLng(31.6508, -99.01),
			myOptions = {
				zoom: 5,
				minZoom: 5,
				center: center,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			},
			that = this;
			
		this.map = new google.maps.Map(this.el, myOptions);

		// turn this off, for now, until I figure out how to make it work properly!
		//google.maps.event.addListener(this.map, 'idle', this.fitBounds );
		utils.logger.log("instanciating mapView:[[");
		if ( this.collection ){
			utils.logger.log("coll:" + this.collection.length );
			this.collection.bind("add", this.addMarker );
			this.collection.bind("change", this.addMarker );
			this.collection.bind("reset", this.render );
		}
		
		if ( this.masterColl ) {			
			utils.logger.log("masterColl:" + this.masterColl.length );
			this.masterColl.bind("add", function(model){that.addMarker(model,true,false)} );
			this.masterColl.bind("reset", this.render );
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
		utils.logger.log("]]map rendering!");
		this.clearMarkers();
		
		// addMarker for all halls in filtered coll
		if ( this.collection.models.length > 0 )
			this.collection.each( this.addMarker );
			
		// addMarker for all halls in master Coll without filteredColl
		if ( this.masterColl ) {
			var filteredIDs = this.collection.pluck("hall");
			this.masterColl.each( function(hall){if ( _(filteredIDs).indexOf(hall.id) == -1 ) this.addMarker(hall, true);}, this );
		}
	},
	
	// not used, at the moment...
	fitBounds : function() {
		if ( this.bounds && ! this.bounds.isEmpty() )
			this.map.fitBounds( this.bounds );
	},
	
	/**
	 * Retrieve the actual hall given a particualr model
	 * (even if it already IS a hall...)
	 *
	 * @return (VenueModel) the hall
	 */
	getHall : function( model ) {
		var hallID = model.get("hall");
		if ( hallID )
			return model.collection.colls.halls.get( hallID );
		else if ( model instanceof VU.VenueModel )
			return model;
		return null;
	},
	
	clearMarkers : function() {
		if ( this.markers ) _.each( this.markers, function(m){m.setMap(null);});		
		this.markers = {};
		this.bounds = new google.maps.LatLngBounds();
	},
	
	removeMarker : function(m) {
		var hall = this.getHall( m );
		if ( hall && hall.id in this.markers )
			this.markers[hall.id].setMap(null);
	},
	
	/**
	 * Add a marker
	 * 
	 * @param (Model) model Model of hall to all
	 * @param (boolean) m If true then this marker is in masterColl (i.e. background)
	 * @param (boolean) overwrite If true the overwrite if marker already exists 
	 */
	addMarker : function ( model, m, overwrite ) {
		overwrite === undefined && (overwrite = true); //default to true
		var hall = this.getHall( model );
		if ( !hall ) return;
		hall && hall.unbind( "change", this.addMarker );
		var modelID = hall.id;
		
		//shortcut out if marker already exists and is in same mode, OR overwrite isn't allowed
		if ( modelID in this.markers && (!overwrite || m == this.markers[ modelID ].collMode )) return;
		
		// convert gps to LatLng
		var master = _.isBoolean(m) && m,
			gps = hall.get( "GPS Coordinates" ) || hall.get( "gpsCoordinates" );			
		gps = utils.parseGPS( gps );
		gps = (gps.lat ? new google.maps.LatLng( gps.lat, gps.lng ) : null);
		
		// Marker icon precedence: 1) status, 2) styleMarker, 3) grey-circle.png
		var currentUse = hall.get( "currentUse" ) || "";
		var markerURL;
		switch (currentUse.toLowerCase()) {
			case "bar":
			case "church hall":
			case "community center":
			case "event rental":
			case "lodging":
			case "public dances":
			case "restaurant":
			case "social club":
			case "theater":
			case "dances, rentals, meetings":
			case "event rental, public dances":
				markerURL = "http://maps.google.com/mapfiles/ms/micons/blue-dot.png";
				break;
			case "church services":
			case "commercial":
			case "dwelling":
			case "retail":
			case "storage":
			case "unknown":
			case "vacant":
				markerURL = "http://maps.google.com/mapfiles/ms/micons/yellow-dot.png";
				break;
			case "gone":
				markerURL = "http://maps.google.com/mapfiles/ms/micons/red-dot.png";
				break;
			default :
				markerURL = hall.get( "styleMarker" );
				if ( markerURL ){
					markerURL = "http://maps.google.com/mapfiles/ms/micons/" + markerURL + ".png";
				} else {
					//markerURL = "http://maps.google.com/mapfiles/ms/micons/red-dot.png";
					markerURL = "http://maps.google.com/mapfiles/ms/micons/blue-dot.png";
				}
		}
		
		// map it!
		if ( gps ) {
			var mOptions = master ? {
					map: this.map, 
					position: gps,
					title: null,
					clickable : false,
					icon: new google.maps.MarkerImage( 
						"images/grey-circle.png",
						new google.maps.Size(9,9),
						null, null, 
						new google.maps.Size(9,9)
					),
					zIndex : -999
				} : {
					map: this.map, 
					position: gps,
					title: hall.get("danceHallName"),
					clickable : true,
					icon: new google.maps.MarkerImage( 
						markerURL,
						null,
						null, null, 
						null 
					),
					zIndex : 999
				};
				
			//if ( !master )
				//this.bounds.extend( gps );
			
			//utils.logger.log( "Adding markerID: " + modelID + " master:" + m );
				
			if ( modelID in this.markers ){
				this.markers[ modelID ].setOptions( mOptions );
			} else {
				var marker = new google.maps.Marker( mOptions );
				this.markers[ modelID ] = marker;
				google.maps.event.addListener( marker, "click", function () { 
					location.href = "#///" + hall.collection.url + "&" + modelID; 
				});
			}
			this.markers[ modelID ].collMode = m;
			
		//no gps, so let's try the address, on navColl halls only!
		} else if ( this.addyOn && !master && hall ) {
			var address = hall.get( "address" );
			if ( ! address )
				hall.bind( "change", this.addMarker );
			else {
				address = address.replace('\n', ' ');
				if ( !(address in this.gcs) ){
					utils.logger.log("[MapView] Attempting to find geocode for " + address);
					// HACK: using only the first 4 chars of addy, to give better chance of matchin properly-formatted addy in attachToMap
					var mini = address.substr(0,4);
					if ( ! mini in this.gcs ){
						this.gcs[mini] = hall;
						this.geocoder.geocode( { 'address': address}, this.attachToMap );
					}
				}
			}
		}
	},
	
	/**
	 * Callback for running a geocode on an address
	 */
	attachToMap: function(results, status) {
		var model = this.gcs[ results[0].formatted_address.substr(0,4) ];
		if (status == google.maps.GeocoderStatus.OK) {
			var marker = new google.maps.Marker({
				map: this.map, 
				position: results[0].geometry.location
			});
			utils.logger.log("[MapView] Geocode found for " + results[0].formatted_address);
			if ( model )
				this.markers[ model.id ] = marker;
		}
	}
});

/**
 * A view for displaying and interacting with the datePicker
 *  calendar
 */
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

/**
 * A view for wrapping the jQCloud
 */
VU.TagCloudView = Backbone.View.extend({
	initialize : function() {
		_.bindAll( this, "render", "addTags", "removeTags" );
		this.tags = [];
		this.tagsHash = [];
		this.collection.bind( "reset", this.render );
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
		this.rendered = true;
	},
	
	addTags : function( model ){
	},
	
	removeTags : function( model ){
	}
});

/**
 * Base class for all tab views
 *  Manages gui behind tab activation
 */
VU.ParentView = Backbone.View.extend({
	initialize : function() {
		_.bindAll( this, "activate", "deactivate" );
		this.colls = this.options.colls;
		this.active = false;
	},
	
	activate : function( filter ) {
		if ( this.active ) return;
		this.tabEl.addClass( "active-link" );
		this.el.css("display","block");
		this.active = true;
	},
	
	deactivate : function() {
		if ( ! this.active ) return;
		this.tabEl.removeClass( "active-link" );
		this.el.hide();
		this.active = false;
	}
});

/**
 * Wraps a search box
 */
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
	
	/**
	 * Event handler for all interaction with the searchfield
	 *
	 * @param (Event) searchField The jQuery event wrapping the interaction
	 */
	handleSearch : function( searchField ) {
		var input = searchField.target;
		utils.logger.log(searchField.type);
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
				
				// This is a horrible HACK... once we get a real FilterModel up and running, this will go smoother
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
				utils.logger.log(input.value);
				break;
		}
	}
});
//}
};