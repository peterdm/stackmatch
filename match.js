var running = false;

var handler = function() {
	if (!running && $('#candidates').length==0 && $('#jobdetailpage').length==1) {
		running = true;
		suggestUsers($('#tags').find('.post-tag'), $('#share'));	
	}
	
};

function suggestUsers(childElements, insertAfter) {	
	var query = "";

	$.each(childElements, function(index, value) {
		var boost = 1.0 + (0.1 / (index + 1));
		console.log(value.text + "^" + boost);
		query += value.text + "^" + boost + " ";
	});

	if (query) {
		$.getJSON('http://localhost:8983/solr/posts/usersuggest', { q: query }, createSearchCallback(insertAfter));
	}
	else {
		running = false;
	}
}


function getUserInfo(searchData, insertAfter) {
	var suggestions = [];
	var soapiQuery = "";
	var lasttag = "";
	var numberFound = searchData['response']['numFound'];

	$.each(searchData['facet_counts']['facet_fields']['AnswererId'], function(index, value) {
		if (index%2==0) {
			lasttag = value;
		} else {
			suggestions.push(lasttag+'|'+value);
			if (soapiQuery!='') { soapiQuery += ';'; }
			soapiQuery += lasttag;
		}
	});
	
	soapiQuery.replace(/\;$/,'');
	
	if (soapiQuery) {
		$.getJSON('http://api.stackexchange.com/2.0/users/'+soapiQuery, {
			'site':'stackoverflow'}, createSoapiCallback(suggestions, insertAfter)
		);
	}
	else {
		running = false;
	}
}

function layoutSuggestions(suggestions, userData, insertAfter) {


	var newDiv = $('<div/>').css({
		'padding' : '15px',
		'margin-bottom' : '20px',
		'background-color' : '#FEF1D8'
	}).append($('<h2/>').text('Great Candidates'));
	
	newDiv.attr('id', 'candidates');
	
	insertAfter.after(newDiv);
	
	var link = '';
	var lastOpactity = 1;
	var firstValue = 0;
	var key = '';
	$.each(suggestions, function(index, item) {
		var parts = item.split("|");
		key = parts[0];
		value = parts[1];
		
		if (firstValue==0) firstValue = value;
		link = $('<a/>').addClass('post-tag');
		
		$.each(userData['items'], function(index, user) {
			if (user['user_id']==key) {
				var title = user['display_name'];
				title += (user['location']) ? ' ('+user['location']+')' : '';
				title += ' <reputation:' + user['reputation'] + '>';
				
				link.attr({
					'href' : user['link'],
					'id' : user['user_id'],
					'title' : title
 				});

				link.append($('<img/>').attr('src', user['profile_image']+'&size=48'));
				console.log(user['display_name'] + ' ('+value+')');
			}
		});
		
		//link.text(key);
		link.attr('href', 'http://www.stackoverflow.com/users/'+key);
		var opacity = value/firstValue; // comparitive
		link.css({
			'color' : '#7b9fb8',
			'background-color' : 'rgba(224, 234, 241,' + opacity + ')',
			'border-bottom' : '1px solid rgba(62, 109, 142,' + opacity + ')',
			'border-right' : '1px solid rgba(127, 159, 182,' + opacity + ')',
			'text-transform' : 'none',
			'padding' : '5px',
			'margin-left' : '3px'
		});
		newDiv.append(link);
	});
	
	// start listening for DOMChanged
	running = false;
};


function createSearchCallback(insertAfter) {
	return function(searchData) {
		getUserInfo(searchData, insertAfter);
	};
};

function createSoapiCallback(suggestions, insertAfter) {
	return function(userData) {
		layoutSuggestions(suggestions, userData, insertAfter);
	};
};


document.addEventListener('DOMNodeInserted', handler, false);
$(handler);



