function couchapp_load(scripts) {
  for (var i=0; i < scripts.length; i++) {
    document.write('<script src="'+scripts[i]+'"><\/script>')
  };
};

couchapp_load([
  "https://www.google.com/jsapi?key=ABQIAAAAgTqM9xpxSoLaSkppM01quxQbXEMm7kp-42chvbW_H66SE-blxxRCJNIhhMPoQ-q2h1tdYimcxDmF4Q&autoload=%7B%22modules%22%3A%5B%7B%22name%22%3A%22search%22%2C%22version%22%3A%221.0%22%2C%22language%22%3A%22en%22%7D%5D%7D",
  "http://maps.google.com/maps/api/js?sensor=false",
  "/_utils/script/sha1.js",
  "/_utils/script/json2.js",
  /*"/_utils/script/jquery.js",*/
  /*"js/lib/jquery-1.6.2.min.js",*/
  "https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.js",
  "js/lib/jquery-ui-1.8.16.custom.min.js",
  "/_utils/script/jquery.couch.js",
  "js/lib/jquery.form.js",
  "js/lib/jqcloud-0.2.4.js",
  "js/lib/underscore.js",
  "js/lib/backbone.js",
  "js/lib/backbone-couchdb.js",
  "js/lib/dustjs/dist/dust-full-0.3.0.js",
  "js/lib/inputex/lib/yui/yuiloader/yuiloader.js",
  "js/lib/inputex/lib/yui/dom/dom.js",
  "js/lib/inputex/lib/yui/event/event.js",
  "js/lib/inputex/build/inputex.js",
  "js/lib/inputex/js/fields/FileField.js",
  "js/lib/inputex/js/fields/DatePickerField.js",
  "js/vu.js",
  "js/utils.js",
  "js/schemas.js",
  "js/models.js",
  "js/views/SchemaFormView.js",
  "js/collections.js",
  "js/bbViews.js",
  "js/popupViews.js",
  "js/persistentRouter.js",
  "js/app.js"
]);