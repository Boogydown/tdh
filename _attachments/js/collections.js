VU.InitColls = function () {
/////////////////////////////////////////////////////////////////////////////}
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
/* Backbone.Collection extension that adds:
 * 	fetched flag to signal whether it was recently fetched
 *	diff as an option to fetch, which will add or remove models without refreshing
 *  index to model, which is the index at which it was placed when added
 */
VU.Collection = Backbone.Collection.extend({
	fetched : false,
	fetching: false,
	
	fetch : function(options) {
		if ( this.fetching ) return;
		this.fetched = false;
		this.fetching = true;
		options || (options = {});
		var collection = this;
		var success = options.success;
		options.success = function(resp) {
			collection.fetched = true;
			collection.fetching = false;
			collection[options.add ? 'add' : options.diff ? 'diff' : 'refresh'](collection.parse(resp), options);
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
	// Pass **keepParent** to avoid reparenting when adding
	// Diff means it will add or remove models without having to refresh
	diff : function( models, options ) {
		// add new models...
		this.add( models, options );
			
		// remove those not in the new set...
		this.remove( _.difference( this.models, models ), options );
		
		return this;
    },
	
	// wrapper for _remove that allows for keepParent
	_remove : function( model, options ) {
		var parent = model.collection;
		Backbone.Collection.prototype._remove.call( this, model, options );
		if ( options.keepParent ) model.collection = parent;
	},			
	
    // Override of backbone._add to get model.index, AND support
	// 	passing **keepParent** to avoid reparenting when adding
	// Internal implementation of adding a single model to the set, updating
    // 	hash indexes for `id` and `cid` lookups.
    _add : function(model, options) {
      options || (options = {});
      if (!(model instanceof Backbone.Model)) {
        model = new this.model(model, {collection: this});
      }
      var already = this.getByCid(model);
	  if (already) {
		if ( options.ignoreDups )
			return;
		else
			throw new Error(["Can't add the same model to a set twice", already.id]);
	  }
      this._byId[model.id] = model;
      this._byCid[model.cid] = model;
      if ( ! options.keepParent ) model.collection = this;
      var index = this.comparator ? this.sortedIndex(model, this.comparator) : this.length;
      this.models.splice(index, 0, model);
	  // added this so that we can use it to find the model's place in the coll without having to search for it
	  model.index = index;
      model.bind('all', this._onModelEvent);
      this.length++;
      if (!options.silent) model.trigger('add', model, this, options);
      return model;
    }
	
});

/* A locally-filtered collection
 * MUST instanciate with {masterCollection: myKeyedCollection} passed in options
 */
VU.LocalFilteredCollection = VU.Collection.extend({
	initialize : function( models, options ) {
		_.bindAll( this, "refreshed", "changed" );
		this.masterCollection = options.collection;
		this.masterCollection.bind( "change", this.changed );
		this.masterCollection.bind( "refresh", this.refreshed );
		
		// need a full master coll if we're going to pull off of it
		// TODO: move this to applyfilters?
		//if ( !this.masterCollection.fetched ) 
			//this.masterCollection.fetch();
	},
	
	changed : function( ) {
		// a model changed, so let's reapply filters
		if ( this.curFilters )
			this.applyFilters( this.curFilters, this.curLimit );
	},
	
	refreshed : function( ) {
		// completely reload
		this.remove( this.models, {keepParent:true} );
		this.changed();
	},
	
	//filterObj: [{key:, start:, end:}]
	applyFilters : function( filters, limit ) {
		this.curFilters = filters;
		this.curLimit = limit;
		if ( this.masterCollection.fetched )
			// we don't want the model's parent collection to change: it belongs to the master collection
			this.diff( this.masterCollection.getFiltered( filters, limit ), {keepParent:true, ignoreDups:true} );
			// TODO: add "complete" callback
		else
			this.masterCollection.fetch( {success: this.changed} );
	},
	
	nextPage : function( limit ) {
		var models = this.masterCollection.nextPage( limit );
		if ( models ) 
			this.add( models );
			// TODO: add "complete" callback
	}
});

VU.KeyedCollection = VU.Collection.extend({
	initialize : function(models, options) {
		this.keys = [];
		this.filterableKeys || (this.filterableKeys = []);
		_.bindAll( this, "reloadKeys", "removeKeys", "addKeys" );
		this.bind( "refresh", this.reloadKeys );
		this.bind( "remove", this.removeKeys );
		this.bind( "add", this.addKeys );
	},
	
	finalize : function() {
		this.unbind( "refresh", this.reloadKeys );
		this.unbind( "remove", this.removeKeys );
		this.unbind( "add", this.addKeys );
		this.unbind( "change", this.changeKeys );
	},
	
	reloadKeys : function() {
		this.keys = [];
		this.each( this.addKeys );
		this.bind( "change", this.changeKeys );
	},
	
	changeKeys : function( model ) {
		removeKeys( model.previousAttributes() );
		addKeys( model );
	},
	
	addKeys : function( model ) {
		//TODO: add these keys in sorted order; use to speed up removekeys and query
		//TODO: BETTER YET, have this come in diretly from couch, instead of building it by hand
		var key, value, i, j;
		for ( i in this.filterableKeys ) {
			key = this.filterableKeys[i];
			value = model.get(key);
			if ( value ) {
				// in case an attribute is actually an array of values....
				values = _.isArray( value ) ? value : [value];
				for ( j in values ) {
					value = values[j];
					if ( key in this.keys ) {
						if ( value in this.keys[key] )
							this.keys[key][value].push(model);
						else
							this.keys[key][value] = [model];
					}
					else {
						this.keys[key] = [];
						this.keys[key][value] = [model];
					}
				}
			}
		}
	},
	
	removeKeys : function( model ) {
		if ( model instanceof Backbone.Model )
			model = model.attributes;
		var key, value, i;
		for ( i in this.filterableKeys ) {
			key = this.filterableKeys[i];
			value = model[key];
			if ( value ) {
				// we can assume that it must be in here, if not then just ignore
				valModels = this.keys[key][value];
				if ( valModels && valModels.length > 1 )
					valModels && valModels.splice( valModels.indexOf(model), 1 );
				else{
					//cleanup
					delete this.keys[key][value];
					if (this.keys[key].length == 0)
						delete this.keys[key];
				}
			}
		}
	},
	
	//filterObj: [{key, start, end}]
	getFiltered: function ( filters, limit ) {
		this.lastLimit = limit || this.length;
		var i = 0, fl, filter, curVals, finalModels, innerModels, hasHit = false;
		if ( filters )
			for( fl = filters.length; i < fl; ) {
				filter = filters[i++];
				curVals = this.keys[filter.key];
				if ( curVals ){
					hasHit = true; //one of the filters has hit...
					innerModels = [];
					for ( value in curVals )
						if ( (value >= filter.start && value <= filter.end) )
							innerModels = innerModels.concat( curVals[value] );
					if ( finalModels )
						finalModels = _.intersection( finalModels, innerModels );
					else
						finalModels = innerModels;
				}
			}
		if ( finalModels || hasHit ) {
			finalModels || (finalModels = [] );
			this.allFilteredModels = finalModels;
			return limit ? _.first(finalModels, limit) : finalModels;
		}
		//else
		this.allFilteredModels = this.models;
		return limit ? _.first(this.models, limit) : this.models;
	},
	
	nextPage : function ( limit ) {
		if ( this.lastLimit && this.lastLimit < this.allFilteredModels.length )
			return this.allFilteredModels.slice( this.lastLimit, this.lastLimit += (limit || this.lastLimit) )
	}
});

// Now let's define a new Collection of Events
VU.EventCollection = VU.KeyedCollection.extend({
	url : "event",
	model : VU.EventModel,
	viewName : "crossFilter",
	query : '?startkey=["event",' + new Date().getTime() + ',null,null]&endkey=["event",[],[],[]]',
	filterableKeys: ["dateUnix", "lat", "lng", "band", "hall", "onDCard"],
	
	// The events should be ordered by date
	comparator : function(event){
		return new Date( event.get("date") ).getTime();
	},
	
	initialize : function ( models, options ) {
		VU.KeyedCollection.prototype.initialize.call(this, models, options);
		if ( options ) {
			this.schema = options.schema;
			this.colls = options.colls;
		}
	},
	
	// overriden to pass colls down to the models
	fetch : function( options ) {
		options || (options = {});
		options.colls = this.colls;
		VU.KeyedCollection.prototype.fetch.call( this, options );
	}	
});

VU.BandCollection = VU.KeyedCollection.extend({
	url : "band",
	viewName : "crossFilter",
	query : '?startkey=["band",null,null,null]&endkey=["band",[],[],[]]',
	model : VU.BandModel,
	filterableKeys: ["stylesPlayed", "bandName"],
	comparator : function(band){
		return band.get("bandName");
	}
});	

VU.HallCollection = VU.KeyedCollection.extend({
	url : "dancehall",
	viewName : "crossFilter",
	query : '?startkey=["dancehall",null,null,null]&endkey=["dancehall",[],[],[]]',
	model : VU.VenueModel,
	filterableKeys: ["danceHallName", "lat", "lng"],
	comparator : function(hall){
		return hall.get("danceHallName");
	}
});
};