//Get permission to use the API with our appID
window.fbAsyncInit = function() {
    FB.init({
	appId      : '332847230172667',
	xfbml      : true,
	version    : 'v2.1'
    });
};


(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response); 
    if (response.status === 'connected') {
	connected();
    } else if (response.status === 'not_authorized') {
	document.getElementById('status').innerHTML = 'Please log ' +
	    'into this app.';
    } else {
	document.getElementById('status').innerHTML = 'Please log ' +
	    'into Facebook.';
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

(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

//Successful login
function connected() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
	console.log('Successful login for: ' + response.name);
	document.getElementById('status').innerHTML =
	    'Thanks for logging in, ' + response.name + '!';
    });

}
