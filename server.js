var stormpath = require('stormpath');
var http = require('http');
var connect = require('connect');

function routeHandler(req,res) {

  /* catchall route handler, will handle all http requests to this server */

  var isOauthTokenRequest = req.url === '/oauth/token';

  stormpathApplication.authenticateApiRequest(req,function(err,authResult){

    if(err){
      res.statusCode = 500;
      res.write(err.message);

      // TODO - we should probably set a 500 or 401 status property
      // on the err, to indicate if it's a authorization error or
      // some other error.  this route handler could then pass
      // that code along, instead of just giving a generic 500

    }else{
      res.setHeader('content-type','application/json');

      if(isOauthTokenRequest){

        // they asked for a token and were successfuly validated
        // with the credentials they supplied
        // now to some logic to determine what scopes the can have
        // and then send them a toke

        authResult.addScope('all-the-things');
        authResult.addScope('plus-some');

        res.write(JSON.stringify(authResult.getTokenResponse()));

      }else if(authResult.requestedScopes){

        // use requsted scopes to verify what the user can have
        // then construct a responst accordingly

        var scopeList = authResult.requestedScopes.join(', ');
        var message = "Your token is valid, you have these scopes: " + scopeList;
        res.write(JSON.stringify({message: message}));
      }else{

        // this was a basic API auth request, so do what you want
        // for the given resource URI now that the client is
        // authenticated
        authResult.getAccount(function(err,account){
          if(err){
            throw err; // actually you should deal with it :)
          }else{
            var message = 'Thanks, ' +
              account.username +
              ', for authenticating!  You asked for ' +
              req.url;
            res.write(JSON.stringify({message:message}));
          }
        });

      }

    }
    res.end();
  });
}

var homeDir = process.env[(process.platform === 'win32' ? 'USERPROFILE' : 'HOME')];
var apiKeyFilePath = homeDir + '/.stormpath/apiKey.properties';

var stormpathApplication;

var server = connect();

server.use(connect.bodyParser());

server.use(routeHandler);

stormpath.loadApiKey(apiKeyFilePath, function apiKeyFileLoaded(err, apiKey) {
  if (err){ throw err; }

  var client = new stormpath.Client({apiKey: apiKey});

  client.getApplication('https://api.stormpath.com/v1/applications/1h72PFWoGxHKhysKjYIkir',function(err,app){
    if (err){ throw err; }
    stormpathApplication = app;
    http.createServer(server).listen(3000);
  });
});
