#Texas Dance Hall Preservation Calendar App

This is live code for TexasDanceHall.org/calendar 

It is a couchapp that is running on CouchDB (a no-SQL, map-reduce, self-serving database).

App highlights:
- Event listings
- Band and User creation
- List live-filtering by text search
- List live-filtering by Calendar range selection
- List live-filtering via tag/category cloud
- Interactive Google map integration
- Persistent data for Dance Card tab
- Large dataset querying and management
- Dynamic, schema-based form creation 

Technology
- CouchDB on basic Linux server (it serves its own HTTP)
- CouchAPP for serving HTML and JS apps
- Backbone.js front end (plus `backbone-couch` for tying into couchDB)
- jQuery (plus `jquery-couch` for ajax mods for couchDB)
- jQuery UI's Calendar plugin
- Google Maps
- Dustjs templates
- jqCloud
- InputEx for dynamic form creation

Notable directories
- /views : these are the map-reduce query views for couchDB
- /vendor/couchapp/_attachments : contains loaders for the app
- /_attachments : the main html path
- /_attachments/js/app.js : the calendar app
- /_attachments/js/sf-app.js : the "Schema Form" app for editing the db using the dynamically-created forms
