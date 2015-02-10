var searchTimeout;

$(document).ready(function () {
	
	loadUserSongs();
	
    $('#searchInput').keyup(function(){ 
    	
    	var searchInput = $(this).val();
    	
        if(searchTimeout)
        {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(function()
        {
        	searchAjaxRequest( searchInput );
        }, 500);

    });
});

function loadUserSongs(){
	
	$.ajax( "http://spotiface-grisard.rhcloud.com/spoti/user/" + userId + "/songs" )
	.done(function(data) {
		
		for( var i = 0; i < data.length; i++){
			displaySong( data[i].song_id );
		}
	});
	
}

function searchAjaxRequest( searchInput ){
	console.log(encodeURIComponent( searchInput ));
    $.ajax( "https://api.spotify.com/v1/search?q=" + encodeURIComponent( searchInput ) + "&limit=5&type=track" )
    	.done(function(data) {
	    
			$("#searchResult > tbody").empty();
		    for(var i = 0; i < data.tracks.items.length; i++){
		    	var srcUri = "https://embed.spotify.com/?uri="+ data.tracks.items[i].uri
		    	var rowString = "";
		    	
		    	rowString = "<tr> <td>" + data.tracks.items[i].artists[0].name + "</td>";
		    	rowString += "<td>" + data.tracks.items[i].name + "</td>";
		    	rowString += "<td class='text-center'><a><span onClick='javascript: playStopSong( \" " + data.tracks.items[i].preview_url + " \", $(this)); toggleButton($(this));' class='playbutton glyphicon glyphicon-play-circle'></span></a>";
		    	rowString += " <a><span onClick='javascript: addSong(\""+ data.tracks.items[i].id + "\", \"" + data.tracks.items[i].name + "\")' class='glyphicon glyphicon-plus'></span></a> </td> </tr>";
		    	
		    	$("#searchResult tbody").append( rowString );
		    }
		    
		    
		    if( data.tracks.items.length > 0){
		    	$("#searchResultDiv").collapse('show')
		  	  	console.log(data);
		    }
		    else{
		    	$("#searchResultDiv").collapse('hide')
		    }
		    $(".logo").toggle();
		    
		  })
	    .fail(function() {
	      // alert( "error" );
	    })
	
}

function addSong( id, name ){
	$.ajax({
		  type: "PUT",
		  url: "http://spotiface-grisard.rhcloud.com/spoti/user/" + userId +  "/songs",
		  dataType: "json",
		  data: {songId: id, songName: name},
		  statusCode: {
				  423: function( data ) {

					  $('#alertDiv').html( data.responseText )
					  $('#alertDiv').show();
					  
				    },
				  200: function( data ){
					  $('#alertDiv').hide();
					  displaySong( id );				  
				  }  
			  }
		});
	
}

function displaySong( songId ){
	
	 $.ajax( "https://api.spotify.com/v1/tracks/" + songId )
	  .done(function(data) {
		  console.log(data);
		  
		  var rowString = "";
		  
		  rowString = "<tr id ='" + songId + "'> <td>" + data.artists[0].name + "</td>";
		  rowString += "<td>" + data.name + "</td>";
		  rowString += "<td class='text-center'><a><span onClick='javascript: playStopSong( \" " + data.preview_url + " \", $(this) ); toggleButton( $(this) );' class='playbutton glyphicon glyphicon-play-circle'></span></a>";
		  rowString += " <a><span onClick='javascript: deleteSong(\""+ data.id + "\")' class='glyphicon glyphicon-trash'></span></a> </td> </tr>";
		  
		  $("#songList tbody").append( rowString );
		  
	  }).fail(function() {
		  // alert( "error" );
	  })
	
}

function deleteSong( songId ){
	$.ajax({
		type: "DELETE",
		url: "http://spotiface-grisard.rhcloud.com/spoti/user/" + userId +  "/songs",
		dataType: "json",
		data: {songId: songId},
		statusCode: {
			423: function( data ) {
				
				$('#alertDiv').html( data.responseText )
				$('#alertDiv').show();
				
			},
			200: function( data ){
				$('#alertDiv').hide();
				$("#"+songId).remove();
			}  
		}
		});
	
}

function playStopSong( src, element ){
	
	var classList = element.classList;

	if( element.hasClass( "glyphicon-play-circle" )){
		document.getElementById("iframePlay").src=src;
	}
	else{
		document.getElementById("iframePlay").src="";
	}
}

function toggleButton( element ){
	
	if( element.hasClass("glyphicon-play-circle")){
		//reset all buttons
		$(".playbutton").removeClass("glyphicon-stop glyphicon-play-circle")
		$(".playbutton").addClass("glyphicon-play-circle")
	}
	
	element.toggleClass( "glyphicon-play-circle glyphicon-stop" )
	
}






