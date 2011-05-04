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

// This view is responsible for creating the add/edit fields
var FormView = DustView.extend({
        initialize : function(){
                // Add each field to the form in turn
                _.each(this.options.fields, function(field) {
                    var foo = new FormFieldView(field);
                    this.el.append(foo.render().el);
                }, this);
        }
});

var FormFieldView = DustView.extend({
        tagName : "p",

        initialize : function(){
                this.options.type = this.options.type || "text";
                this.registerTemplate("input-" + this.options.type);
        },
        
        getData : function(){
            return this.options;
        }
});

var SchemaForm = FormView.extend({
    el : $("#model_edit"),

    events : {
            "click #send" : "onSubmit"
    },

    initialize : function(){
            _.bindAll(this, "onSubmit");

            this.options.fields = [
                {
                    field_id: "name",
                    description: "Name",
                    type: "text"
                },
                {
                    field_id: "text",
                    description: "Text",
                    placeholder: "Your text",
                    type: "textarea"
                },
                {
                    field_id: "send",
                    type: "submit"
                }
            ];

            FormView.prototype.initialize.call(this);
    },

    // Simply takes the vals from the input fields and 
    // creates a new Comment.
    onSubmit : function(){
        var name = $("#name").val();
        var text = $("#text").val();
        // sanitize user input...you never know ;)
        name = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        Comments.create({
                "name" : name,
                "text" : text
        });
    }
});
