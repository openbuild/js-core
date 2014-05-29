define(['durandal/app', 'toastr', 'jquery'], function(app, toastr, jquery){

	if(window.OpenBuildDataService){
	
		return window.OpenBuildDataService;
		
	}else{
	
		var DataService = function(){
			
			var self = this;
			self.debug = false;
			self.reconnectInterval = 1000;
			self.timeoutInterval = 2000;
			
			var callbackSuccesses = {};
			var callbackErrors = {};
			
			var wsTimer = 0;			
			var wsConnection = null;
			
			var wsOpen = function(){
			
				wsConnection = new WebSocket(window.WEB_SOCKET_URI);
			
				wsConnection.onopen = function(event){

					if(wsTimer){
						clearInterval(wsTimer);
						wsTimer=0;
					}
				
					toastr.options.showDuration = 1000;
					toastr.info('Connected to the server for realtime messaging.');
				
				};
				
				wsConnection.onmessage = function(event){
			
					try{
				
						data = JSON.parse(event.data);

						if(data.uri && data.payload){
					
							console.log('Got good data back');
							console.log(data);
					
							app.trigger(data.uri, data.payload);
							app.trigger('developer', data);
										
						}else if(data.uri == 'api_response_error' || data.uri == 'api_format_error'){
						
							var errorMessage = '<p>' + data.errorMessages.join('</p><p>') + '</p>';
						
							toastr.options.closeButton = true;
							toastr.options.closeHtml = '<button><i class="icon-off"></i></button>';
							toastr.options.timeOut = null;
							toastr.error('The server complained about the request: ' + errorMessage, 'Error: ' + data.statusCode);

							console.log('Got bad data back');
							console.log(data);
						
						}
					
					}catch(e){
				
				
					}
							
				};
			
				wsConnection.onclose = function(){
			
					toastr.options.showDuration = 1000;
					toastr.error('Disconnected from the server, trying to reconnect');
			
					if(! wsTimer){
						wsTimer=setInterval(function(){
							wsOpen();
						}, self.timeoutInterval);
 					}
			
				};
			
			};
			
			if("WebSocket" in window){
			
				wsOpen();
			
			}else{
			
				toastr.options.closeButton = true;
				toastr.options.closeHtml = '<button><i class="icon-off"></i></button>';
				toastr.options.timeOut = null;
				toastr.error('Your browser does not support the latest standards and it\'s producers are holding back the web.  Please upgrade to a modern browser such as Chrome, Firefox, Opera or Safari.  We will try and launch a fall back service, hold tight!', 'Bad browser :(');

				
				require(['ws/swfobject'], function(swfo){
				
					if (swfobject.getFlashPlayerVersion().major < 10){
					
						toastr.options.closeButton = true;
						toastr.options.closeHtml = '<button><i class="icon-off"></i></button>';
						toastr.options.timeOut = null;
						toastr.error('You need to <a href="http://get.adobe.com/flashplayer/">upgrade your version of Flash</a> for the fall back to work.', 'Bad browser :(');

					}else{
					
						require(['ws/web_socket'], function(wsl){

							toastr.options.showDuration = 1000;
							toastr.info('Loaded web-socket fallback.');
				
							wsOpen();
					
						});
					
					}
								
				});
				
			}
			
			self.setRouteHandler = function(uri, callbackSuccess, callbackError){
			
				callbackSuccesses[uri] = callbackSuccess;
				callbackErrors[uri] = callbackError;
				
			};
			
			self.sendMessage = function(data){
			
				//TODO - check the format before sending...
			
				if(data !== null && typeof data === 'object'){
					wsConnection.send(JSON.stringify(data));
				}else if(data !== null && typeof data === 'string'){
					wsConnection.send(data);
				}else{
					//FIXME - complain
				}
			
			};
			
			self.sendJson = function(data, callbackHandle){
			
				if(data !== null && typeof data === 'object'){
				
					var uri = data.uri;
					var sendData = data.data;
					
					if(uri.charAt(0) != '/'){
						uri = '/' + uri;
					}
				
				}else if(data !== null && typeof data === 'string'){
					//wsConnection.send(data);
				}else{
					//FIXME - complain
					return;
				}
			
				jquery.ajax({
					url: uri,
					type: "POST",
					data: JSON.stringify(sendData),
					dataType: "json",
					contentType:"application/json; charset=utf-8"
				}).done(function(data) {
					console.log('done ajax');
					console.log(data);
					
					if(data.uri && data.payload){
					
						console.log('Got good data back');
						console.log(data);
					
						app.trigger(data.uri, data.payload);
						app.trigger('developer', data);
										
					}
					
				}).fail(function(jqXHR, textStatus){
					console.log('fail ajax');
					console.log(textStatus);
					console.log(jqXHR);
				});
			
			};
			
		};
		
		window.OpenBuildDataService = new DataService();
		
		return window.OpenBuildDataService;
	
	}

	var DataService = function() {
		var self = this;
	};

	return new DataService();

});