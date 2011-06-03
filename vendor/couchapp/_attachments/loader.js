function couchapp_load(scripts) {
  for (var i=0; i < scripts.length; i++) {
    document.write('<script src="'+scripts[i]+'"><\/script>')
  };
};

couchapp_load([
  "https://www.google.com/jsapi?key=ABQIAAAAgTqM9xpxSoLaSkppM01quxQbXEMm7kp-42chvbW_H66SE-blxxRCJNIhhMPoQ-q2h1tdYimcxDmF4Q",
  "/_utils/script/sha1.js",
  "/_utils/script/json2.js",
  "/_utils/script/jquery.js",
  "/_utils/script/jquery.couch.js",
  "js/lib/underscore.js",
  "js/lib/backbone.js",
  "js/lib/backbone-couchdb.js",
  "js/lib/dustjs/dist/dust-full-0.3.0.js",
  "js/utils.js",
  "js/app.js"
]);