// Useful get-var parser by Josh Fraser

window.utils = {
	$_GET : function (q,s) {
		s = (s) ? s : window.location.search;
		var re = new RegExp('&'+q+'=([^&]*)','i');
		return (s=s.replace(/^\?/,'&').match(re)) ? s=s[1] : s='';
	},
	
	/**
	 * Handler for clicking band or venue; creates popup
	 * @param popDocID - id of the document
	 * @param popID - id of the div of the popup we want
	 * @param popWidth - width of the popup
	 **/
	popupHandler : function ( popDocID, popID, popWidth ) {
		// TODO: populate popup with popDocID's data
		
		
		//Fade Popup in and add close button
		$('#' + popID).fadeIn().css({ 'width': Number( popWidth ) }).prepend('<a href="#" class="close"><img src="images/button-x.png" width="30" border="0" class="close_popup" title="Close Window" alt="Close" /></a>');

		//Margin defines center alignment (vertical and horizontal) - add 80px to the height/width for the padding  and border width as defined in the css
		var popMargTop = ($('#' + popID).height() + 80) / 2;
		var popMargLeft = ($('#' + popID).width() + 80) / 2;

		//Margin for Popup
		$('#' + popID).css({
			'margin-top' : -popMargTop,
			'margin-left' : -popMargLeft
		});

		//Fade Background
		$('body').append('<div id="fade"></div>'); //Add fade layer at the end of the selected tag. 
		$('#fade').css({'filter' : 'alpha(opacity=80)'}).fadeIn(); //Fade in the fade layer - .css({'filter' : 'alpha(opacity=80)'}) is used to fix the IE Bug on fading transparencies 

		return false;
	},

	popupInit : function() {
		//Set up Close for Popup and Fade for all future instances
		$('a.close, #fade').live('click', function() { //When clicked to close or fade layer...
			$('#fade , .popup_block').fadeOut(function() {
				$('#fade, a.close').remove();  //fade them both out
			});
			return false;
		});
	}
};