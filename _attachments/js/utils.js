window.utils = {

	// Useful get-var parser by Josh Fraser
	$_GET : function (q,s) {
		s = (s) ? s : window.location.search;
		var re = new RegExp('&'+q+'=([^&]*)','i');
		return (s=s.replace(/^\?/,'&').match(re)) ? s=s[1] : s='';
	},
	
	readCookie : function (name,delimit){
	  if (document.cookie == ''){
		return false;
	  }
	  else {
		var fC,lC;
		var mcookie = unescape(document.cookie);
		fC = mcookie.indexOf(name);
		var ph = fC + name.length;
		if ((fC != -1) && (mcookie.charAt(ph) == '=')){
		  fC += name.length + 1;
		  lC = mcookie.indexOf(delimit,fC);
		  if (lC == -1) lC = mcookie.length;
		  return unescape(mcookie.substring(fC,lC));
		}
		else{
		  return false;
		}
	  }
	},
	
	elipsesStr : function ( str, length ) {
		return (str && str.length && (str.length + 3 > length) && str.substr(0, length) + "..." ) || str;
	},
	
	/* Static class for managing some waiting UI (i.e. loading spinner, progress bar, etc)
	 * A stub for expanding in the future
	 *
	 */
	waitingUI : {
		el : {},
		
		init : function ( el ) {
			this.el = $(el);
		},
		
		show : function () {
			this.el.show();
		},
		
		hide : function () {
			this.el.hide();
		}	
	},
	
	// flier is optional
	flyAway : function( src, dest, flier ) {
		flier = flier ? flier.clone() : src.clone();
		var srcOff = src.offset(),
			destOff = dest.offset();
		flier.attr("style", "position:fixed;z-index:999;left:" + srcOff.left + ";top:" + srcOff.top );
		flier.appendTo("body");
		flier.animate( {
			opacity: 0.25,
			left: destOff.left,
			top: destOff.top
		}, null, null, function () { $(this).remove(); } );
	},

	// boxID must be id of a text input box
	SearchBox : function( boxID, listView, filterKey ) {
		this.el = $(boxID);
		this.listView = listView;
		this.filteredColl = this.listView.collection;
		this.filterKey = filterKey;
		this.defaultSearchVal = this.el.val();		
		this.el.focusin( this, utils.SearchBox.handleSearch );
		this.el.focusout( this, utils.SearchBox.handleSearch );
		this.el.keyup( this, utils.SearchBox.handleSearch );
		//this.el.change( this.handleSearch );
		
		utils.SearchBox.prototype.handleSearch = function( that, searchField ) {
			var input = searchField.target;
			console.log(searchField.type, ":", input.value);
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
					
					// find my bandName filter and either remove it (str=="") or replace it with new search
					var filters = this.filteredColl.currentFilters || [];
					var filterKey = this.filterKey;
					if ( input.value == "" ) {
						if ( filters.length > 0 )
							this.filteredColl.currentFilters = _.reject(filters, function(f){return f.key==filterKey});
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
					
					this.listView.applyFilters();
					console.log( "Applying search filter of " + input.value + " for " + this.filterKey );
					break;
			}
		}		
	}
};