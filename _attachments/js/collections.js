VU.InitColls = function () {
/////////////////////////////////////////////////////////////////////////////}
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
/**
 * Backbone.Collection extension that adds:
 * 	fetched flag to signal whether it was recently fetched
 *	diff as an option to fetch, which will add or remove models without reseting
 *  index to model, which is the index at which it was placed when added
 */
VU.Collection = Backbone.Collection.extend({
	fetch : function(options) {
		utils.logger.log( this.name + ".fetch()" );		
		if ( this.fetching ) return;
		this.fetched = false;
		this.fetching = true;
		options || (options = {});
		var collection = this;
		var success = options.success;
		options.success = function(resp) {
			collection.fetched = true;
			collection.fetching = false;
			collection[options.add ? 'add' : options.diff ? 'diff' : 'reset'](collection.parse(resp), options);
			if (success) success(collection, resp);
		};
		options.error = this.wrapError(options.error, collection, options);
		(this.sync || Backbone.sync)('read', this, options);
		return this;
    },
	
	/**
	 * Get a model from this collection.  If the model doesn't exist then 
	 * 	try to retrieve it from the server
	 *
	 * @param (string) modelID Id of model to get
	 * @param (function) success Success callback
	 * @param (function) failure Failure callback
	 */
	serverGet : function( modelID, success, failure ) {
		var model = this.get( modelID );
		if ( model ) {
			success( model );
		} else {
			model = new this.model( { id:modelID } ); 
			this.add( model );
			model.fetch({
				success: success,
				error: failure
			});
		}			
	},

	/**
	 * copy of the BackBone private wrapError
	 */
	wrapError : function(onError, model, options) {
	  return function(resp) {
		if (onError) {
		  onError(model, resp, options);
		} else {
		  model.trigger('error', model, resp, options);
		}
	  };
	},	
	
    /**
	 * Diff a model, or list of models, to the set. 
	 * Diff means it will add or remove models without having to reset
	 * Pass **silent** to avoid firing the `added` or 'removed' 
	 *	events for every different model.
	 * Pass **keepParent** to avoid reparenting when adding
	 */
	diff : function( models, options ) {
		// add new models...
		this.add( models, options );
			
		// remove those not in the new set...
		this.remove( _.difference( this.models, models ), options );
		
		return this;
    },
	
	/**
	 * wrapper for _remove that allows for keepParent
	 */
	_remove : function( model, options ) {
		var parent = model.collection;
		Backbone.Collection.prototype._remove.call( this, model, options );
		if ( options.keepParent ) model.collection = parent;
	},			
	
    /**
	 * Override of backbone._add to get model.index, AND support
	 * 	passing **keepParent** to avoid reparenting when adding
	 * Internal implementation of adding a single model to the set, updating
     * 	hash indexes for `id` and `cid` lookups.
	 */
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

/**
 * A collection that contains a filtered subset of models
 * It must have a master collection, which holds all of the models, therefore
 * MUST instanciate with {masterCollection: myKeyedCollection} passed in options
 */
VU.LocalFilteredCollection = VU.Collection.extend({
	initialize : function( models, options ) {
		this.currentFilters = [];
		this.bootLoad = 20;
		this.name = _.uniqueId(options.name);
		this.allPagesLoaded = false;
		options.model && (this.model = options.model);
		this.masterCollection = options.collection;
		this.comparator = this.masterCollection.comparator;
		this.model = this.masterCollection.model;
		_.bindAll( this, "reseted", "applyFilters", "onGotFiltered" );
	},
	
	/**
	 * Completely reload
	 */
	reseted : function( ) {
		this.remove( this.models, {keepParent:true} );
		this.applyFilters();
	},
	
	/**
	 * Re-popuplate me with modules based on an array of filters
	 * This is asynchronous as we may have to wait on the master collection to 
	 * fully fetch all of its models from the server.
	 * 
	 * @param (array) filters Array of filterObjs: [{key:, start:, end:}]
	 * @param (number) limit How many to retrieve?
	 */
	applyFilters : function( filters, limit ) {
		utils.logger.log( this.name + ".applyFilters( " + filters, limit + " )");
		this.allPagesLoaded = true;
		filters && ( this.currentFilters = filters );
		
		// if we already have a bunch of stuff in the coll then just diff from here
		if ( this.length )
			limit = -1;
			
		this.tail = limit || this.bootLoad;

		if ( _.isArray(this.currentFilters) )
			this.masterCollection.getFiltered( { 
				filters: this.currentFilters, 
				callback: this.onGotFiltered,
				name: this.name //for debugging 
			} );
	},
	
	onGotFiltered : function ( filteredModels, totalFiltered, lastPage ) {
		// keepParent: we don't want the model's parent collection to change: it belongs to the master collection
		utils.logger.log( this.name + ".onGotFiltered( " + filteredModels.length + " models recieved, last page: " + lastPage + ")");
		this.fullLength = totalFiltered;
		this.allFiltered = filteredModels;
		this.head = 0;
		if (this.tail < 1)
			this.tail = this.allFiltered.length;
		this.allPagesLoaded = this.allFiltered.length <= this.tail;
		
		this.diff( this.allFiltered.slice(this.head,this.tail), {keepParent:true, ignoreDups:true} );
		if ( !this.attached ) {
			this.masterCollection.bind( "keysChanged", this.applyFilters );
			this.masterCollection.bind( "reset", this.reseted );
			this.attached = true;
		}
		this.trigger( "filtered" );
	},
	
	nextPage : function( num ) {
		if ( this.tail >= this.allFiltered.length ) return;
		this.head = this.tail + 1;
		num || ( num = this.allFiltered.length );
		this.add( this.allFiltered.slice(this.head,this.tail += num), {keepParent:true, ignoreDups:true} );
		this.allPagesLoaded = this.allFiltered.length <= this.tail;
	}
});

/**
 * A master collection of all of the models for a given type (events,
 *	bands, halls).
 * A vast hash of the models' values for each attribute in this.filterableKeys, is built
 * This will allow for quick lookup when filtering by those attributes.
 * This is a cheat local way to have our own map/reduce like the couchdb views
 */
VU.KeyedCollection = VU.Collection.extend({
	initialize : function(models, options) {
		if ( options && options.name )
			this.name = _.uniqueId(options.name);
		
		// hash for quickly cross-referencing key matches
		this.keys = {};
		
		// all of the allowable keys to hash (filter) on
		this.filterableKeys || (this.filterableKeys = []);
		
		// queue of all pending filters (i.e. waiting on a fetch)
		this.filterQueue = [];
		
		_.bindAll( this, "reloadKeys", "changeKeys", "removeKeys", "addKeys", "getFiltered" );
		this.bind( "reset", this.reloadKeys );
	},
	
	finalize : function() {
		this.unbind();
	},
	
	/**
	 * Happens when this collection is reset (loaded in full from server)
	 * This kicks off our keying (creating that hash table) of the entire collection
	 * 	based off of this.filterableKeys
	 */
	reloadKeys : function( ) {
		this.keyed = false;
		this.keys = {};
		// this may remove any external bindings, so for now let's just assume that this.filterableKeys never changes
		//this.unbind("change");
		this.each( this.addKeys );
		this.keyed = true;
		this.bind( "remove", this.removeKeys );
		this.bind( "add", this.changeKeys );
	},
	
	/**
	 * Called only if a model changes so we don't have to re-key the whole collection
	 */
	changeKeys : function( model ) {
		this.removeKeys( model, true );
		this.addKeys( model );
		this.trigger( "keysChanged" );
	},
	
	addKeys : function( model ) {
		//TODO: add these keys in sorted order; use to speed up removekeys and query
		//TODO: can also use underscore's chain().map().flatten().reduce() (see docs www)
		//TODO: BETTER YET, have this come in diretly from couch, instead of building it by hand
		var key, value, values, i, j;
		for ( i in this.filterableKeys ) {
			key = this.filterableKeys[i];
			value = model.get(key);
			if ( value !== undefined ) {
				// in case an attribute is actually an array of values....
				values = _.isArray( value ) ? value : [value];
				for ( j in values ) {
					value = values[j];
					if ( _.isString(value) ) value = value.toLowerCase();
					if ( key in this.keys ) {
						if ( value in this.keys[key] )
							this.keys[key][value].push(model);
						else
							this.keys[key][value] = [model];
					}
					else {
						this.keys[key] = {};
						this.keys[key][value] = [model];
						this.bind( "change:" + key, this.changeKeys );
					}
				}	
			}
		}
	},
	
	removeKeys : function( model, removePrev ) {
		var key, value, values, i, j, valModels, loc,
			// if a model was updated then we want to remove its previous attrs from keys
			attrs = removePrev ? model.previousAttributes() : model.attributes;
		for ( i in this.filterableKeys ) {
			key = this.filterableKeys[i];
			value = attrs[key];
			if ( value !== undefined ) {
				// in case an attribute is actually an array of values....
				values = _.isArray( value ) ? value : [value];
				for ( j in values ) {
					value = values[j];
					if ( _.isString(value) ) value = value.toLowerCase();
					// we can assume that it must be in here, if not then just ignore
					valModels = this.keys[key][value];
					if ( valModels && _.size(valModels) > 1 ) {
						if ( (loc = _(valModels).indexOf(model)) > -1 )
							valModels.splice( loc, 1 );
					} else {
						//cleanup cuz array is empty
						delete this.keys[key][value];
						if (_.size(this.keys[key]) == 0)
						{
							this.unbind( "change:" + key, this.changeKeys );
							delete this.keys[key];
						}
					}
				}
			}
		}
	},
	
	/**
	 * Retrieve a filtered subset of models
	 * This is asynchronous because we may have to fetch all of the models if
	 * we haven't done so, yet, or are still in the process of fetching
	 *
	 * @param (object) filterParams Looks like {filters:[{key, start, end}], tail:int, callback:func}
	 */
	getFiltered: function ( filterParams ) {
		this.unbind("reset", this.getFiltered);
		//we add to a queue in case multiple filter requests come in while we're waiting on the fetch to return
		if ( filterParams && filterParams !== this ) 
			this.filterQueue.push( filterParams );

		utils.logger.log( this.name + ".getFiltered(" + ( filterParams && filterParams.name) + ", " + this.filterQueue.length + " queued )" );
		
		if ( !this.fetched ) {
			if ( this.fetching ) {
				utils.logger.log( this.name + ".getFiltered( waiting for previous fetch... )" );
				this.bind("reset", this.getFiltered);
			} else {
				this.fetch( {success: this.getFiltered} );
			}
			return;
		}
		if ( !this.keyed ) this.reloadKeys();
		
		// begin the filtering process....
		var i = 0, 
			fl, filter, curVals, finalModels, innerModels, value,
			fp = this.filterQueue.shift();
		if ( fp && fp.filters )
		{
			utils.logger.log( this.name + ".getFiltered(), processing " + fp.name );
			for( fl = fp.filters.length; i < fl, filter = fp.filters[i++]; ) {
				curVals = this.keys[filter.key];
				if ( curVals ){
					// for each key, check all the values
					innerModels = [];
					for ( value in curVals ){
						if ( filter.start !== undefined ) {
							if ( (value >= filter.start && value <= filter.end) )
								innerModels = innerModels.concat( curVals[value] );
						} else if ( filter.str && filter.str != "" ) {
							if ( value.indexOf( filter.str ) > -1 )
								innerModels = innerModels.concat( curVals[value] );
						} else if ( filter.notStr && filter.notStr != "" ) {
							if ( value.indexOf( filter.notStr ) == -1 )
								innerModels = innerModels.concat( curVals[value] );
						}
					}
					if ( finalModels )
						finalModels = _.intersection( finalModels, innerModels );
					else
						finalModels = innerModels;
				}
			}
		}
		
		// if not found then was empty, so give all
		finalModels || (finalModels = this.models);
		if ( fp ) {
			fp.tail || ( fp.tail = finalModels.length );
			if ( _.isFunction(fp.callback) )
				fp.callback( finalModels.slice( 0, fp.tail ), finalModels.length, fp.tail >= finalModels.length );
		}
		if ( this.filterQueue.length > 0 )
			this.getFiltered();
	}	
});

/**
 * Collection of Events
 */
VU.EventCollection = VU.KeyedCollection.extend({
	url : "event",
	model : VU.EventModel,
	viewName : "crossFilter",
	query : '?startkey=["event",' + (new Date().getTime() - 2*24*60*60*1000) + ',null,null]&endkey=["event",[],[],[]]',
	filterableKeys: ["dateUnix", "lat", "lng", "band", "hall", "onDCard"],
	
	/**
	 * Used by backbone to determine sort order.
	 * Events should be ordered by date
	 */
	comparator : function(event){
		return new Date( event.get("date") ).getTime();
	},
	
	initialize : function ( models, options ) {
		_.bindAll( this, "fetch" );
		VU.KeyedCollection.prototype.initialize.call(this, models, options);
		this.schema = options.schema;
		this.colls = options.colls;
	},
	
	/**
	 * Overriden to pass colls down to the models
	 */
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
	filterableKeys: ["stylesPlayed", "bandName", "status"],
	comparator : function(band){
		return band.get("bandName");
	}
});	

VU.HallCollection = VU.KeyedCollection.extend({
	url : "dancehall",
	viewName : "crossFilter",
	query : '?startkey=["dancehall",null,null,null]&endkey=["dancehall",[],[],[]]',
	model : VU.VenueModel,
	filterableKeys: ["danceHallName", "lat", "lng", "county"],
	comparator : function(hall){
		return hall.get("danceHallName");
	}
});
};