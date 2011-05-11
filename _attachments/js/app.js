$(function(){
    // Fill this with your database information.
    // `ddocName` is the name of your couchapp project.
    Backbone.couchConnector.databaseName = "schema_form";
    Backbone.couchConnector.ddocName = "schema_form";
    Backbone.couchConnector.viewName = "byCollection";
    // If set to true, the connector will listen to the changes feed
    // and will provide your models with real time remote updates.
    Backbone.couchConnector.enableChanges = false;

    // The model for a comment is kinda simple.
    // We only need a name, a text and a date.
    var CommentModel = Backbone.Model.extend({
        initialize : function(){
            if(!this.get("name")){
                    this.set({"name": "Anonymous"});
            }
            if(!this.get("text")){
                    this.set({"text": "Nothing"});
            }
            if(!this.get("date")){
                    this.set({"date": new Date().getTime()});
            }
        }
    });
    
    // Now let's define a new Collection of Comments
    var CommentCollection = Backbone.Collection.extend({
        // The couchdb-connector is capable of mapping the url scheme
        // proposed by the authors of Backbone to documents in your database,
        // so that you don't have to change existing apps when you switch the sync-strategy
        url : "/comments",
        model : CommentModel,
        // The comments should be ordered by date
        comparator : function(comment){
            return comment.get("date");
        }
    });

    var DustView = Backbone.View.extend({
        registerTemplate : function(name) {
            // Relies on inline templates on the page
            dust.compileFn( $('#'+name).html() , name);
            this.template = name;
        },
        
        getData : function(){
            return this.model.toJSON();
        },
        
        render : function(){ 
            var result = '';
            dust.render(this.template, this.getData(), function (err,out) {
                if (err) result = err;
                else result = out;
            } );
            $(this.el).html(result);
            return this;
        }
    });

    // Represents an comment entry
    var EntryView = DustView.extend({
        tagName : "tr",
        
        // Clicking the `X` leads to a deletion
        events : {
            "click .delete" : "deleteMe",
        },
        
        // If there's a change in our model, rerender it
        initialize : function(){
            _.bindAll(this, 'render', 'deleteMe', 'dummyFetch');
            this.model.bind('change', this.render);
            this.registerTemplate('entry');
        },
        
        // Fade out the element and destroy the model
        deleteMe : function(){
            if(this.model)
                this.model.destroy();
            $(this.el).fadeOut("fast",function(){
                $(this).remove();
            });
        }
    });
    
    // The view for all comments
    var CommentsTable = Backbone.View.extend({
        el: $("#model_table"),
        
        initialize : function(){
            _.bindAll(this, 'refreshed', 'addRow', 'deleted');
            
            Comments.bind("refresh", this.refreshed);
            Comments.bind("add", this.addRow);
            Comments.bind("remove", this.deleted);
        },
        
        // Prepends an entry row 
        addRow : function(comment){
            var view = new EntryView({model: comment});
            var rendered = view.render().el;
            this.el.prepend(rendered);
        },
        
        // Renders all comments into the table
        refreshed : function(){
            // reset the table
            this.el.html("");
            // add each element
            if(Comments.length > 0){
                Comments.each(this.addRow);
            }
        },
        
        // A comment has been deleted, so we rerender the table,
        // because this update could also come from another user via the
        // _changes feed
        deleted : function(){
            this.refreshed();
        }
    });
    
    // The App controller initializes the app by calling `Comments.fetch()`
    var App = Backbone.Controller.extend({
        initialize : function(){
            Comments.fetch();
        }
    });


    
    
    var SchemaForm = Backbone.View.extend({
        builder: new inputEx.JsonSchema.Builder(),

        el : $("#model_edit"),

        initialize : function(){
            _.bindAll(this, "onSubmit");
            this.render();
        },
        
        render : function(){
            var fields = this.builder.schemaToInputEx(this.options.schema);
            fields.parentEl = 'model_edit';
            inputEx(fields);
            // YUI onClick used rather than Backbone delegateEvents, because
            //      it started working first. There's probably something simple
            //      I'm missing, but I don't really care at the moment.
            new inputEx.widget.Button({
                id: 'send',
                parentEl: 'model_edit',
                type: 'submit',
                onClick: this.onSubmit,
                value: 'Send'
            });
            return this;
        },

        // Simply takes the vals from the input fields and 
        // creates a new Comment.
        onSubmit : function(){
            var key, values = {}, selector;

            for (key in this.options.schema.properties)
            {
                selector = "#model_edit [name='" + key + "']";
                values[key] = $(selector).val();
            }
            this.collection.create(values);
        }
    });

    var SchemaTable = Backbone.View.extend({
        el: $("#model_table"),

        initialize : function(){
            _.bindAll(this, 'render');

            this.collection.bind("refresh", this.render);
            this.collection.bind("add", this.addRow);
            this.collection.bind("remove", this.deleted);
        },

        render: function(){
            var header, 
                cells = [], 
                fields = this.options.schema.properties;

            this.el.html("");

            for (key in fields)
            {
                cells.push( this.make('th',{},fields[key].description) );
            }

            header = this.make('tr',{},cells);
            this.el.append(header);

            if(this.collection.length > 0){
                this.collection.each(this.addRow);
            }
        },
        
        
        // Prepends an entry row 
        addRow : function(model){
            var view = new SchemaTableRow({model: model, schema: this.options.schema});
            this.el.append(view.render().el);
        }
    });
    
    var SchemaTableRow = Backbone.View.extend({
        render: function(){
            var row, 
                cells = [], 
                fields = this.options.schema.properties;

            this.el.html("");
            
            for (key in fields)
            {
                cells.push( this.make('td',{},fields[key].description) );
            }
            row = this.make('tr',{},cells);
            this.el.append(row);
        }
    });




    var Comments = new CommentCollection();
    comment_schema = {
        "description":"A comment",
        "type":"object",
        "properties":{
            "name":{
                "description":"Name",
                "type":"string"
            },
            "text":{
                "description":"Comment",
                "placeholder": "Your text",
                "type":"text"
            }
        }
    };
    schemaForm = new SchemaForm({ schema : comment_schema, collection: Comments });
//     new CommentsTable();
    schemaTable = new SchemaTable({ schema : comment_schema, collection: Comments });
    new App();
//     schemaTable.render();

});