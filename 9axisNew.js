/*
	sensorTag Accelerometer example
	This example uses Sandeep Mistry's sensortag library for node.js to
	read data from a TI sensorTag.
	Although the sensortag library functions are all asynchronous,
	there is a sequence you need to follow in order to successfully
	read a tag:
		1) discover the tag
		2) connect to and set up the tag
		3) turn on the sensor you want to use (in this case, accelerometer)
		4) turn on notifications for the sensor
		5) listen for changes from the sensortag
	This example does all of those steps in sequence by having each function
	call the next as a callback. Discover calls connectAndSetUp, and so forth.
	This example is heavily indebted to Sandeep's test for the library, but
	achieves more or less the same thing without using the async library.
	created 15 Jan 2014
	by Tom Igoe
	
	
	Since been edited to properly fit the digital-gym team project. Added code to send live raw data to server.
	
	07/15/2016 
	James Grinage & Connor Heggie
	Rice Univeristy, 2018
*/



var request = require('request');			//allows http requests to be sent
var SensorTag = require('sensortag');		// sensortag library
const WINDOW_SAMPLE_NUM = 40;				// sends data every 

// listen for tags:
SensorTag.discover(function(tag) {			//on discovery the function defined inside the parentheses (a callback) will be run
	var buffer = {};
											//acts as a buffer to store data before being sent
	// when you disconnect from a tag, exit the program:
	tag.on('disconnect', function() {		//event listener for the disconnect event
		console.log('disconnected!');
		process.exit(0);
	});

	function connectAndSetUpMe() {			// attempt to connect to the tag
	 	console.log('connectAndSetUp');
	 	tag.connectAndSetUp(enableAll);		// when you connect and device is setup, call enableWOM
  	 }

   	function enableAll() {		// attempt to enable everything
   		console.log('Inside Enable All');
	 	tag.enableAccelerometer(dataRate);	//enables the 9 axises and then calls notifyMe
   	}

   	function dataRate() {
   		console.log('inside Data Rate');
   		tag.setSamplingRate(25, notifyMe);
   	}

	function notifyMe() {
	    	console.log("inside NotifyMe");
	    	tag.notifyMPU9250(listenFor9Change);   	// start the accelerometer listener
   	}

   	function listenFor9Change(){
   		tag.on('accelerometerChange', function(x, y, z){
			var xG, yG, zG, xM, yM, zM = 0;
			//add to global buffer use timestamp
			var time = Math.floor(Date.now());  //milliseconds from January 1, 1970
			buffer[String(time)] = [x, y, z, xG, yG, zG, xM, yM, zM];
			//console.log(buffer[String(time)]);
			//post request async
			if(Object.keys(buffer).length >= WINDOW_SAMPLE_NUM){
				//need to deep copy the buffer and then pass it in to avoid problems with
				var newBuff = buffer;
				buffer = {};
				sendData(newBuff);
				}
   		});
   	}

	function sendData(buff){  //post request
		request.post({"url": 'http://routing-processing-flask.azurewebsites.net/bike-data/117', 'json': buff});	//fix this to include form data (aka just any data in general)
		console.log('data sent');
	}

	// when you get a button change, print it out:
	function listenForButton() {
		tag.on('simpleKeyChange', function(left, right) {
			if (left) {
				console.log('left: ' + left);
			}
			if (right) {
				console.log('right: ' + right);
			}
			// if both buttons are pressed, disconnect:
			if (left && right) {
				tag.disconnect();
			}
	   });
		tag.on('dicsonnect', function(){
			console.log('disconnected');
		});
	}


	// Now that you've defined all the functions, start the process:
	connectAndSetUpMe();
});
