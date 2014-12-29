var searchTimeout;

$(document).ready(function () {
    $('#searchInput').keyup(function(){ 
    	
    	var searchInput = $(this).val();
    	
        if(searchTimeout)
        {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(function()
        {
        	searchAjaxRequest( searchInput );
        }, 700);

    });
});

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
		    	rowString += "<td class='text-center'><a> <span onClick='javascript: playSong( \" " + data.tracks.items[i].preview_url + " \")' class='glyphicon glyphicon-play-circle'></span>  </a>";
		    	rowString += "<a> <span onClick='javascript: displaySong(\""+ data.tracks.items[i].id + "\")' class='glyphicon glyphicon-plus'></span> </a> </td> </tr>";
		    	
		    	$("#searchResult tbody").append( rowString );
		    }
		    
		    
		    if( data.tracks.items.length > 0){
		    	$("#searchResultDiv").collapse('show')
		  	  	console.log(data);
		    }
		    else{
		    	$("#searchResultDiv").collapse('hide')
		    }
		  })
		    
	    .fail(function() {
	      // alert( "error" );
	    })
	
}
function playSong( src ){
	document.getElementById("iframePlay").src=src;
}

function displaySong( id ){
    $.ajax( "https://api.spotify.com/v1/tracks/" + id )
	.done(function(data) {
		console.log(data);
		
    	var rowString = "";
    	
    	rowString = "<tr id ='" + id + "'> <td>" + data.artists[0].name + "</td>";
    	rowString += "<td>" + data.name + "</td>";
    	rowString += "<td class='text-center'><a> <span onClick='javascript: deleteSong(\""+ data.id + "\")' class='glyphicon glyphicon-trash'></span> </a> </td> </tr>";
    	
    	$("#songList tbody").append( rowString );
		
	  })
	    
    .fail(function() {
      // alert( "error" );
    })
}

function deleteSong( id ){
	$("#"+id).remove();
}