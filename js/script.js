
// Variables Declarations (they will be subsitited by Mobile Phone Native after)
var lat = 49.282927;
var lon = -123.122590;
var places = []

/////////////////////////////////////////////////////////////////////
/////////////////// Function Declarations ///////////////////////////
/////////////////////////////////////////////////////////////////////

// Initialize Google Maps API
function initMap(lat, lon) {
  	var places_ids = [];

  	var request = {
    	location: new google.maps.LatLng(lat, lon),
    	radius: '500',
    	types: ['cafe']
	};

	var container = document.getElementById('results');

	var service = new google.maps.places.PlacesService(container);

	service.nearbySearch(request, callback);

	// Get all caffes nearby
	function callback(results, status) {
	    if (status == google.maps.places.PlacesServiceStatus.OK) {
	    	idArr = [];
	    	results.map(function(item){
	    		idArr.push(item.place_id);
	    	});
	    	detailCallback(idArr, buildPage);
	    }
	}

	// Call Back to get each cafe details
	function detailCallback(results, callback) {

		results.map(function(item){
    		service.getDetails({
            placeId: item
          }, function (place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
            	place.imageUrl = place.photos[0].getUrl({'maxWidth': 42, 'maxHeight': 42});
            	places.push(place);
            }
          });
    	});

		/*********************************/
		// First setTimout used to get the distance from the cafe to current location
		// Without the timeout the request was made before I actually had a cafe, and the result was null
    	setTimeout(function(){
    		var distance = new google.maps.DistanceMatrixService;
    		places.map(function(item, index){
    			//Distance Matrix//
	    		var geometry = item.geometry.location.lat() + ',' + item.geometry.location.lng();

	    		distance.getDistanceMatrix({
	    			origins: [lat+','+lon],
	    			destinations: [geometry],
	    			travelMode: 'WALKING' 
	    		}, function(response, status){
	    			if (status === 'OK') { 
	            		places[index].distance = response.rows[0].elements[0].distance.value + 'm';
	            	}
	    		});
	    		// End of distance Matrix
    		})

    	}, 1000);

        /*********************************/
		// Second setTimout used to call callback function
		// Without this timeout the request was made before I actually an array of Cafes (which the call back needs)
        setTimeout(callback, 2000);
        
	}
}

// Function to Build the page (usng the places array to produce a list of cafes)
function buildPage() {

	$.each( places, function(key, value){
		let website = value.website ? value.website : value.url;
		let status = value.opening_hours.open_now ? 'OPEN' : 'CLOSED';
		let place_id = value.place_id;
		let star = "star_border";

		if(localStorage.favorites) {
			var obj = JSON.parse(localStorage.favorites);
			if(obj.hasOwnProperty(place_id)) {
				star = "grade";
			}
		}

		var html = '<li data-id="' + key + '" class="place collection-item avatar">';
		    html += '<img src="' + value.imageUrl + '" alt="" class="circle">';
		    html += '<span class="title"><a href="' + website + '">' + value.name + '</a></span>'
		    html += '<p>' + value.vicinity + '</p>'
		    html += '<p class="distance">' + value.distance + ' from here. <strong>' + status + '</strong></p>';
		    html += '<div class="chip"><a href="' + value.formatted_pone_number + '">Call<i class="close material-icons">settings_phone</i></a></div>';
		    html += '<div class="chip"><a class="url">Reviews<i class="close material-icons">assignment</i></a></div>';
		    html += '<a class="favorite secondary-content" data-id="' + key + '"><i class="material-icons">' + star + '</i></a>';
		    html += '</li>';
		$('.places-list').append(html);
	});
}

//Function to get Reviews to be displayed on modal (reviews from Google Maps API)
function getReviews(id) {

	var result;
	let reviews = "";

	places[id].reviews.map(function(review){
		let content = review.text;
		let rating = Math.round(review.rating);
		let ratingsStar = '<span class="stars">';
		for(var i = 1; i <= 5; i++) {
			if(i <= rating) {
				ratingsStar += '<i class="material-icons">star</i>';
			} else {
				ratingsStar += '<i class="material-icons">star_border</i>';
			}
		}
		ratingsStar += '</span>';
		reviews += '<li class="review-cell collection-item">';
		reviews += '<p class="rating-stars">' + ratingsStar + '</p>';
		reviews += '<p class="review-text more">' + review.text + '</p>';
		reviews += '<p><em>' + review.author_name + '</em></p>';
		reviews += '</li>';
	});
	return reviews; 
}

//Function to get Reviews to be displayed on modal (reviews stored on localStorage)
function getReviewsLocal(obj, key) {

	var result;
	let reviews = "";

	obj[key].reviews.map(function(review){
		let content = review.text;
		let rating = Math.round(review.rating);
		let ratingsStar = '<span class="stars">';
		for(var i = 1; i <= 5; i++) {
			if(i <= rating) {
				ratingsStar += '<i class="material-icons">star</i>';
			} else {
				ratingsStar += '<i class="material-icons">star_border</i>';
			}
		}
		ratingsStar += '</span>';
		reviews += '<li class="review-cell collection-item">';
		reviews += '<p class="rating-stars">' + ratingsStar + '</p>';
		reviews += '<p class="review-text more">' + review.text + '</p>';
		reviews += '<p><em>' + review.author_name + '</em></p>';
		reviews += '</li>';
	});
	return reviews; 
}

// localStorage manipulation functions
function setStorage(obj) {
	if(localStorage.favorites) {
		let key = obj.place_id;
		var favObj = JSON.parse(localStorage.favorites);
		if(favObj.hasOwnProperty(key)) {
			alert('You already have this cafe as a favourite');
		} else {
			favObj[key] = obj;
			localStorage.setItem('favorites', JSON.stringify(favObj));
			alert('Cafe added successfuly!');
		}
	} else {
		let title = obj.place_id;
		var favObj = {};
		favObj[title] = obj;
		localStorage.setItem('favorites', JSON.stringify(favObj));
		alert('Cafe added successfuly!');
	}
}

function removeStorage(key) {
	if(localStorage.favorites) {
		var favObj = JSON.parse(localStorage.favorites);
		delete favObj[key];
		localStorage.setItem('favorites', JSON.stringify(favObj));
		getFavorites();
	}
}


// Function to populate Favorites.html (and update on items delete)
function getFavorites() {
	if(localStorage.favorites) {
		var favObj = JSON.parse(localStorage.favorites);
		$('.fav-list').html('');

		if(Object.keys(favObj).length !== 0) {
			$.each( favObj, function(key, value){
			
				let website = value.website ? value.website : value.url;
				let status = value.opening_hours.open_now ? 'OPEN' : 'CLOSED';
				let place_id = value.place_id;
				let star = "grade";

				var html = '<li data-key="' + value.place_id + '" class="place collection-item avatar">';
				    html += '<img src="' + value.imageUrl + '" alt="" class="circle">';
				    html += '<span class="title"><a href="' + website + '">' + value.name + '</a></span>'
				    html += '<p>' + value.vicinity + '</p>'
				    html += '<p class="distance">' + value.distance + ' from here. <strong>' + status + '</strong></p>';
				    html += '<div class="chip"><a href="' + value.formatted_pone_number + '">Call<i class="close material-icons">settings_phone</i></a></div>';
				    html += '<div class="chip"><a class="url">Reviews<i class="close material-icons">assignment</i></a></div>';
				    html += '<a class="remove-favorite secondary-content" data-key="' + key + '"><i class="material-icons">' + star + '</i></a>';
				    html += '</li>';
				$('.fav-list').append(html);
			});

			var button = '<div class="container center clear-div"><a class="waves-effect red darken-3 btn-large clear-favorites">clear favorites</a></div>';
		
			if( !$('.clear-div').length ) {
				$('.content').append(button);
			}
		} else {
			$('.fav-warning').html('<p class="content-padded fav-warning">You have no favourites so far!</p>');
			if( $('.clear-div').length ) {
				$('.clear-div').remove();
			}
		}
		
	} else {
		$('.fav-warning').html('<p class="content-padded fav-warning">You have no favourites so far!</p>');
	}
}



/////////////////////////////////////////////////////////////////////
////////////////////////// Code /////////////////////////////////////
/////////////////////////////////////////////////////////////////////


// Start jQuery
$(function(){

	// Start Modal
	$('.modal').modal();
	
	// Call Google API
	initMap(lat, lon);

	// Get Reviews on click (from API) -> MODAL	
	$('.places-list').on('click', '.url', function(){
		var id = parseInt($(this).parents('.place').data('id'));
		$('.modal-review .title').text(places[id].name);
		var reviews = getReviews(id);
		$('.reviews').html(reviews);
		$('.review-cell').each(function(){
			const showChar = 100;
			const ellipsetext = "...";
			const moretext = "MORE";
			const lesstext = "LESS";
			const content = $(this).find('.review-text').html();
			if(content.length > showChar) {
				var c = content.substr(0, showChar);
            	var h = content.substr(showChar, content.length - showChar);
            	var html = c + '<span class="moreellipses">' + ellipsetext + '&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a class="morelink">' + moretext + '</a></span>';
            	$(this).find('.review-text').html(html);
			}
		});
		$('#modal1').modal('open');
	});

	// Get Reviews on click (from localSTorage)	-> MODAL
	$('.fav-list').on('click', '.url', function(){
		var key = $(this).parents('.place').data('key');
		var objectLocal = JSON.parse(localStorage.favorites);
		$('.modal-review .title').text(objectLocal[key].name);
		var reviews = getReviewsLocal(objectLocal, key);
		$('.reviews').html(reviews);
		$('.review-cell').each(function(){
			const showChar = 100;
			const ellipsetext = "...";
			const moretext = "MORE";
			const lesstext = "LESS";
			const content = $(this).find('.review-text').html();
			if(content.length > showChar) {
				var c = content.substr(0, showChar);
            	var h = content.substr(showChar, content.length - showChar);
            	var html = c + '<span class="moreellipses">' + ellipsetext + '&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a class="morelink">' + moretext + '</a></span>';
            	$(this).find('.review-text').html(html);
			}
		});
		$('#modal1').modal('open');
	});

	// Close Modal
	$('.modal-close').on('click', function(){
		$('.reviews').html('');
		$('#modal1').modal('close');
	});

	// Add and Remove from Favorites (in localStorage) -> From Index (loaded from API)
	$('.places-list').on('click', '.favorite', function(){
		var id = parseInt($(this).data('id'));
		var text = $(this).find('i').text();
		var place_id = places[id].place_id;
		if(text === "star_border") {
			$(this).find('i').text('grade');
			setStorage(places[id]);
		} else {
			$(this).find('i').text('star_border');
			removeStorage(place_id);
		}
	});

	// Remove from Favorites (in localStorage) -> From Favorites.html (loaded from localStorage)
	$('.fav-list').on('click', '.remove-favorite', function(){
		var key = $(this).data('key');
		removeStorage(key);
		getFavorites();
	});

	// Manage "Read More" / "Read Less" on Reviews Modal
	$('.reviews').on('click', '.morelink', function(){
		const moretext = "MORE";
		const lesstext = "LESS";
        if($(this).hasClass("less")) {
            $(this).removeClass("less");
            $(this).html(moretext);
        } else {
            $(this).addClass("less");
            $(this).html(lesstext);
        }
        $(this).parent().prev().toggle();
        $(this).prev().toggle();
        return false;
    });

	// Button to Clear localStorage 
	$('.content').on('click', '.clear-favorites', function(){
		$('.fav-list').html('');
		$('.clear-div').remove();
		localStorage.clear();
		getFavorites();
	});

}); // End of jQuery