VU.InitColls = function () {
/////////////////////////////////////////////////////////////////////////////}
/// COLLECTIONS DECLARATION /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
/* Backbone.Collection extension that adds:
 * 	fetched flag to signal whether it was recently fetched
 *	diff as an option to fetch, which will add or remove models without reseting
 *  index to model, which is the index at which it was placed when added
 */
VU.Collection = Backbone.Collection.extend({
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
			collection[options.add ? 'add' : options.diff ? 'diff' : 'reset'](collection.parse(resp), options);
			if (success) success(collection, resp);
		};
		options.error = this.wrapError(options.error, collection, options);
		(this.sync || Backbone.sync)('read', this, options);
		return this;
    },
	
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
	// Diff means it will add or remove models without having to reset
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
	
	// completely reload
	reseted : function( ) {
		this.remove( this.models, {keepParent:true} );
		this.applyFilters();
	},
	
	//filterObj: [{key:, start:, end:}]
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
	
	changeKeys : function( model ) {
		this.removeKeys( model, true );
		this.addKeys( model );
		this.trigger( "keysChanged" );
	},
	
	addKeys : function( model ) {
		//TODO: add these keys in sorted order; use to speed up removekeys and query
		//TODO: can also use underscore's chain().map().flatten().reduce() (see docs www)
		//TODO: BETTER YET, have this come in diretly from couch, instead of building it by hand
		var key, value, i, j;
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
		var key, value, i, valModels, loc,
			// if a model was updated then we want to remove its previous attrs from keys
			attrs = removePrev ? model.previousAttributes() : model.attributes;
		for ( i in this.filterableKeys ) {
			key = this.filterableKeys[i];
			value = attrs[key];
			if ( _.isString(value) ) value = value.toLowerCase();
			if ( value !== undefined ) {
				// we can assume that it must be in here, if not then just ignore
				valModels = this.keys[key][value];
				if ( valModels && _.size(valModels) > 1 && (loc = _(valModels).indexOf(model)) > -1 )
					valModels.splice( loc, 1 );
				else{
					//cleanup
					delete this.keys[key][value];
					if (_.size(this.keys[key]) == 0)
					{
						this.unbind( "change:" + key, this.changeKeys );
						delete this.keys[key];
					}
				}
			}
		}
	},
	
	//filterParams: {filters:[{key, start, end}], tail:int, callback:func}
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
				utils.logger.log( this.name + ".getFiltered( fetch! )" );
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

// Now let's define a new Collection of Events
VU.EventCollection = VU.KeyedCollection.extend({
	url : "event",
	model : VU.EventModel,
	viewName : "crossFilter",
	query : '?startkey=["event",' + (new Date().getTime() - 2*24*60*60*1000) + ',null,null]&endkey=["event",[],[],[]]',
	filterableKeys: ["dateUnix", "lat", "lng", "band", "hall", "onDCard"],
	
	// The events should be ordered by date
	comparator : function(event){
		return new Date( event.get("date") ).getTime();
	},
	
	initialize : function ( models, options ) {
		_.bindAll( this, "fetch" );
		VU.KeyedCollection.prototype.initialize.call(this, models, options);
		this.schema = options.schema;
		this.colls = options.colls;
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