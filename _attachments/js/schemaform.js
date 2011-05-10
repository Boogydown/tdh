var schemaBuilder = new inputEx.JsonSchema.Builder(); 

var SchemaForm = Backbone.View.extend({
//     el : $("#model_edit"),

    events : {
        "click .submit-button" : "onSubmit"
    },

    initialize : function(){
        _.bindAll(this, "onSubmit");
        this.render();
    },
    
    render : function(){
        // Get the inputEx field definition from the "Comment" object 
        var layout = schemaBuilder.schemaToInputEx(this.options.schema);
        
        layout.type = 'form';

        // Add 'model_edit' as parent element 
        layout.parentEl = 'model_edit';

        // Add a submit button
        layout.buttons  = [ {
            class: 'submit-button',
            type: 'submit',
            value: 'Send'
        } ];
        
        // Create the form 
        this.form = inputEx(layout);
        return this;
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
