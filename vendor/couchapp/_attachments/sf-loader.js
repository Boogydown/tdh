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
  "js/lib/inputex/lib/yui/yuiloader/yuiloader.js",
  "js/lib/inputex/lib/yui/dom/dom.js",
  "js/lib/inputex/lib/yui/event/event.js",
  "js/lib/inputex/build/inputex.js",
  "js/lib/inputex/js/fields/FileField.js",
  "js/utils.js",
  "js/vu.js",
  "js/models.js",
  "js/collections.js",
  "js/bbViews.js",
  "js/sf-app.js"
]);