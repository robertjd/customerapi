var stormpath = require('stormpath');
var express = require('express');
var bodyParser = require('body-parser');

var homeDir = process.env[(process.platform === 'win32' ? 'USERPROFILE' : 'HOME')];
var apiKeyFilePath = homeDir + '/.stormpath/apiKey.properties';
var application;

var app = express();


app.use(bodyParser.urlencoded());

app.post('/oauth/token',function (req,res){
  application.authenticateApiRequest({
    request: req,
    scopeFactory: function(account,requestedScope){
      // determine what scope to give, then return
      return 'granted-scope';
    }
  },function(err,authResult){
    if(err){
      return res.json(400,err);
    }
    res.json(authResult.tokenResponse);
  });
});

app.get('/protected/resource',function (req,res){
  application.authenticateApiRequest({
    request: req
  },function(err,authResult){
    if(err){
      return res.json(400,err);
    }
    authResult.getAccount(function(err,account){
      var message = 'Hello, ' + account.username + '! Thanks for authenticating.';
      if(authResult.grantedScopes){
        message += ' You have been granted: ' + authResult.grantedScopes.join(' ');
      }
      res.json({message: message });
    });
  });
});


stormpath.loadApiKey(apiKeyFilePath, function apiKeyFileLoaded(err, apiKey) {
  if (err){ throw err; }

  var client = new stormpath.Client({apiKey: apiKey});

  client.getApplication('https://api.stormpath.com/v1/applications/1h72PFWoGxHKhysKjYIkir',function(err,_application){
    if (err){ throw err; }
    application = _application;
    app.listen(3000);
  });
});