var schemaBuilder = new inputEx.JsonSchema.Builder(); 

var SchemaForm = Backbone.View.extend({
     el : $("#model_edit"),

    events : {
        "click #send" : "onSubmit"
    },

    initialize : function(){
        this.render();
        _.bindAll(this, "onSubmit");
    },
    
    render : function(){
        // Get the inputEx field definition from the "Comment" object 
        var fields = schemaBuilder.schemaToInputEx(this.options.schema);
        
//         fields.type = 'form';

        // Add 'model_edit' as parent element 
        fields.parentEl = 'model_edit';

/*        // Add a submit button
        buttons  = [  ];*/
        
        // Create the form 
        inputEx(fields);
/*        inputEx.widget.Button({
            id: 'send',
            className: 'submit-button',
            parentEl: 'model_edit',
            type: 'submit',
            value: 'Send'
        });*/
//         this.delegateEvents(); // Bind events to the rendered form elements
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
        return false;
    }
});
