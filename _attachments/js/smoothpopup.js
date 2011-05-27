function PopupHandler () {
	//When you click on a link with class slowpopup and href starts with # 
	window.alert("Initializing Popup");
	$('a.slowpopup[href^=#]').click(function() {
		var popID = $(this).attr('rel'); //Get Popup Name
		var popURL = $(this).attr('href'); //Get Popup href which defines its size

		//Extract Query and Variables from href
		var query= popURL.split('?');
		var dim= query[1].split('&');
		var popWidth = dim[0].split('=')[1]; //Get first query string value

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
	});

	//Close and Fade
	$('a.close, #fade').live('click', function() { //When clicked to close or fade layer...
		$('#fade , .popup_block').fadeOut(function() {
			$('#fade, a.close').remove();  //fade them both out
		});
		return false;
	});
};