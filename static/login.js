//user
var username = "";

//Get permission to use the API with our appID
window.fbAsyncInit = function() {
    FB.init({
	appId      : '332847230172667',
	cookie     : true,
	xfbml      : true,
	version    : 'v2.1'
    });
};

//Load the SDK asynchronously
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

//login if the player tries to connect successfully, or logout
function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    if (response.status === 'connected') {
	player_connect(response);
    }else {
	player_disconnect(response);
    }
  }

function checkLoginState() {
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
  }

FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
});

//log the player in, add name to the lobby
function player_connect(response) {
    FB.api('/me', function(response) {
	console.log('Successful login for: ' + response.name);
	var player = document.createElement('div');
	player.id = response.name;
	player.className = response.name;
	player.innerHTML = response.name;	
	document.getElementById("players").appendChild(player);
	username = response.name;
    });
}

//log the player out, remove name from the lobby

function player_disconnect(response) {
    if (!response.session) {
	player = document.getElementById(username);
	player.remove()
	return;
    }
    FB.logout(player_disconnect)
}

