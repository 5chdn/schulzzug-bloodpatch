"use strict";
let webservice = {
	baseUrl: "http://example.com",
	updateScore: function(score) {
		return request("POST", "/score", {"score": score})
	},
	fetchCurrentScore: function() {
		return request("GET", "/score")
	},
	fetchToken: function() {
		return request("POST", "/token")
	},
	request: function(method, route, data = null) {
		return new Promise(function(resolve, reject) {
			let url = baseUrl + route
			$.ajax({
				type: method,
				url: url,
				data: data,
				success: function(response) {
					resolve(response);
				},
				failure: function(xhr, status, error) {
					reject(thrownError);
				}
			});
		});
	}
}

