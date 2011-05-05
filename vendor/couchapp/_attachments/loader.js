function couchapp_load(scripts) {
  for (var i=0; i < scripts.length; i++) {
    document.write('<script src="'+scripts[i]+'"><\/script>')
  };
};

couchapp_load([
  "/_utils/script/sha1.js",
  "/_utils/script/json2.js",
  "/_utils/script/jquery.js",
  "/_utils/script/jquery.couch.js",
  "js/lib/underscore.js",
  "js/lib/backbone.js",
  "js/lib/backbone-couchdb.js",
  "js/lib/dustjs/dist/dust-full-0.3.0.js",
//   "http://yui.yahooapis.com/2.8.2r1/build/yuiloader/yuiloader-min.js",
//   "js/lib/inputex/js/inputex-loader.js",
  "js/schemaform.js",
  "js/app.js"
]);