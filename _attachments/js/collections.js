VU.InitColls = function () {
/////////////////////////////////////////////////////////////////////////////}
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
VU.Collection = Backbone.Collection.extend({
	fetched : false,
	
	fetch : function(options) {
		this.fetched = false;
		options || (options = {});
		var collection = this;
		var success = options.success;
		options.success = function(resp) {
			collection[options.add ? 'add' : options.diff ? 'diff' : 'refresh'](collection.parse(resp), options);
			collection.fetched = true;
			if (success) success(collection, resp);
		};
		options.error = this.wrapError(options.error, collection, options);
		(this.sync || Backbone.sync)('read', this, options);
		return this;
    },

	// copy of the BackBone private wrapError
	wrapError : function(onError, model, options) {
	  return function(resp) {
		if (onError) {
		  onError(model, resp, options);
		} else {
		  model.trigger('error', model, resp, options);
		}
	  };
	},	
	
    // Diff a model, or list of models to the set. Pass **silent** to avoid
    // firing the `added` or 'removed' events for every different model.
	// Diff means it will add or remove models without having to refresh
	diff : function( models, options ) {
		var model, i, l, newSet = [];
		if (_.isArray(models)) {
			// add new models...
			for ( i = 0, l = models.length; i < l; i++) {
				model = models[i];
				newSet[model.id] = model;
				if ( ! this.getById( model.id ) )
					this._add( model, options );
			}
			// remove those not in the new set...
			this.each( function(model) {
				if ( ! (model.id) in newSet )
					this._remove( model, options );
			});
			
		} else {
			if ( ! this.getByCid( models[i] ) )
				this._add( models[i], options );
		}
		return this;
    },
	
    // Override of backbone._add
	// Internal implementation of adding a single model to the set, updating
    // hash indexes for `id` and `cid` lookups.
    _add : function(model, options) {
      options || (options = {});
      if (!(model instanceof Backbone.Model)) {
        model = new this.model(model, {collection: this});
      }
      var already = this.getByCid(model);
      if (already) throw new Error(["Can't add the same model to a set twice", already.id]);
      this._byId[model.id] = model;
      this._byCid[model.cid] = model;
      model.collection = this;
      var index = this.comparator ? this.sortedIndex(model, this.comparator) : this.length;
      this.models.splice(index, 0, model);
	  // added this so that we can use it to find the model's place in the coll without having to search for it
	  model.index = index;
      model.bind('all', this._onModelEvent);
      this.length++;
      if (!options.silent) model.trigger('add', model, this, options);
      return model;
    },
	
});

VU.FilteredCollection = VU.Collection.extend({
	// max num of models to pull each time
	queryLimit: 20,
	
	// was the last fetch empty?  if so, don't try again...
	lastEmpty: false,
	
	// the last filter that we used
	lastFilterStr: "",
	
	// query used in fetch
	query: "",
	
	initialize : function () {
		_.bindAll( this, "applyFilter", "loadMore", "modelAdded", "parseFilter", "getFromServer" );
	},
	
	applyFilter : function ( newFilter, options ) {
		options = options || {};
		var newFilterStr = this.parseFilter( newFilter );
		if ( newFilterStr != this.lastFilterStr ) {
			
			//reload
			this.query = "?limit=" + this.queryLimit + 
						 "&" + newFilterStr;
			this.lastFilterStr = newFilterStr;
			this.bind( "refresh", this.modelAdded );
			this.lastEmpty = true; 	// true until proven false
			options.diff = true;
			this.fetch( options );
			return true;
		}
		return false;
	},
	
	loadMore : function() {
		if ( ! this.lastEmpty ){
			//load next page (add-only fetch)
			this.query = "?limit=" + this.queryLimit + 
						 "&startkey_docid=" + this.last.id + 
						 "&" + newFilterStr;
			this.bind( "add", this.modelAdded );
			this.lastEmpty = true; 	// true until proven false
			options.add = true;
			this.fetch( options );				
		}
	},
	
	modelAdded : function () {
		this.unbind( "add", this.modelAdded );
		this.unbind( "refresh", this.modelAdded );
		// since refresh triggers regardless of whether something was added, we shuold check the coll length
		this.lastEmpty = this.length == 0;
	},
	
	parseFilter : function ( filterObj ) {
		var filterStr = "";
		// add type to the beginning
		filterObj.startkey.unshift( this.url );
		filterObj.endkey.unshift( this.url );
		filterStr = JSON.stringify( filterObj ).replace(',"endkey":','&endkey=').replace('{"startkey":','startkey=');
		filterStr = filterStr.substr( 0,filterStr.length - 1 );
		return filterStr;
	},
	
	getFromServer : function( id, options ) {
		var model = this.get(id);
		if ( !model ) {
			model = new this.model( {id:id} );
			model.fetch(options);
		}
		return model;
	}
});

// Now let's define a new Collection of Events
VU.EventCollection = VU.FilteredCollection.extend({
	url : "event",
	model : VU.EventModel,
	
	// The events should be ordered by date
	comparator : function(event){
		return new Date( event.get("date") ).getTime();
	},
	
	initialize : function ( models, options ) {
		VU.FilteredCollection.prototype.initialize.call(this, models, options);
		_.bindAll( this, "fetchAndSet", "_setAfterFetch" );
		if ( options ) {
			this.schema = options.schema;
			this.colls = options.colls;
		}
	},
	
	fetchAndSet : function( idAry, attr ) {
		//HACK: Once cached-colls and view-colls get separated, remove this...
		this._fetchSet = {attrKeys:idAry, attr:attr};
		if ( location.hash.length > 1 && location.hash.substr(0,7) != "#Dances" ) {
			var oldQ = this.query;
			this.query = "?startkey=[\"event\"," + new Date().getTime() + "]&endkey=[\"event\",[]]";
			this.fetch( {success:this._setAfterFetch} );
			this.query = oldQ;
		} else if ( this.length == 0 )
			this.bind( "refresh", this._setAfterFetch );
		else
			this._setAfterFetch();
	},
	
	_setAfterFetch : function(  ){
		this.unbind( "refresh", this._setAfterFetch );
		var fetchSet = this._fetchSet,
			coll = this;
		_.each( fetchSet.attrKeys, function(modelID) { 
			var model = coll.get(modelID);  
			if (model) model.set(fetchSet.attr);
		});
	}
});

VU.DCardCollection = VU.EventCollection.extend({
	prevColl : null,
	
	initialize : function ( models, options ) {
		VU.EventCollection.prototype.initialize.call(this, models, options);
		_.bindAll( this, "toggleDCard");
		var globalEvents = options.events;
		if ( globalEvents )
			globalEvents.bind("change:onDCard", this.toggleDCard );
	},

	//called AFTER the change happens...
	toggleDCard : function ( eventModel ) {
		if ( eventModel.get("onDCard") ) {
			this.prevColl = eventModel.collection;
			this.add( eventModel );
		} else {
			this.remove( eventModel );
			eventModel.collection = this.prevColl;
		}			
	}
});

VU.BandCollection = VU.FilteredCollection.extend({
	url : "band",
	model : VU.BandModel,
	comparator : function(band){
		return band.get("bandName");
	}
});	

VU.HallCollection = VU.FilteredCollection.extend({
	url : "dancehall",
	model : VU.VenueModel,
	comparator : function(hall){
		return hall.get("danceHallName");
	}
});
};