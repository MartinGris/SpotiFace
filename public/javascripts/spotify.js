$(document).ready(function () {
   $('#searchInput').keyup(function () { alert('test'); });
});


$("#searchInput").on("change paste keyup", function() {
   alert($(this).val()); 
});