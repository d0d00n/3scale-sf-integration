var express = require('express');
var cors = require('cors');
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var request = require('request');
var app = express();
app.use(express.json());
app.use(cors());

var HTTP_PORT = process.env.PORT || 3000,
    APICAST_SECRET_TOKEN = process.env.APICAST_SECRET_TOKEN || '',
    SALESFORCE_URI = process.env.SALESFORCE_URI || '',
    SALESFORCE_LOGIN_URI = process.env.SALESFORCE_LOGIN_URI || '';


var currentAccessToken = '';

// Create an HTTP service
http.createServer(app).listen(HTTP_PORT,function() {
  console.log('Listening HTTP on port ' + HTTP_PORT);
});


//catch all
app.all('/*', function(req, res) {

    if (!req.header("X-3scale-proxy-secret-token") || req.header("X-3scale-proxy-secret-token") != APICAST_SECRET_TOKEN){
        res.status("401").send("Sorry, buddy!");
        return;
    }
    if (!currentAccessToken){
        salesforceLogin(req,res);
    }
    else{
        request({uri: SALESFORCE_URI+req.path, method: req.method, headers: {'Authorization':'Bearer '+currentAccessToken},
            body: req.body, json:true},
        function (error, response, callBody) {
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            if (response && response.statusCode === 401){
                salesforceLogin(req,res);
            }
            else{
                res.status(response.statusCode).json(callBody);
            }
        });        
    }

  
});

function salesforceLogin(requ,resp){
    request({uri: SALESFORCE_LOGIN_URI, method: 'POST'},
    function (error, response, loginBody) {
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        result = JSON.parse(loginBody);
        console.log(result.access_token);
        currentAccessToken = result.access_token;
        request({uri: SALESFORCE_URI+requ.path, method: requ.method, headers: {'Authorization':'Bearer '+currentAccessToken},
            body: requ.body, json: true},
        function (error, response, callBody) {
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            resp.status(response.statusCode).json(callBody);
        });              
    });
    
}