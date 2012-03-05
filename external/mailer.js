require.paths.unshift(__dirname + "/lib/node");
 
var email = require('email'),
http = require('http'),
sys = require('sys'),
server = email.server.connect({ host: "localhost" });
 
var s = http.createServer(function(req, resp) {
var data;
 
var response = function(code, msg) {
resp.writeHead(code, { 'Content-Type': 'application/plain-text' });
resp.end(msg);
}
 
req.on('data', function(chunk) {
data = JSON.parse(chunk);
});
 
req.on('end', function () {
if (!(data.form.email && data.form.sender &&
data.form.message && data.form.subject)) {
response(500, "Whoops! There was an error sending the email!\n");
} else {
server.send({
text: data.form.message,
from: data.form.email,
to: "Me <my@epic-email.com>",
subject: data.form.subject
}, function(err, msg) {
if (err) throw err;
response(200, "Email sent!!\n");
});
}
});
});
 
var stdin = process.openStdin();
 
stdin.resume();
stdin.setEncoding('utf8');
 
stdin.on('data', function(d) {
s.listen(parseInt(JSON.parse(d)));
});
 
stdin.on('exit', function () {
process.exit(0);
});