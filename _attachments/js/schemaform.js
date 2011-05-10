var schemaBuilder = new inputEx.JsonSchema.Builder(); 

var SchemaForm = Backbone.View.extend({
    el : $("#model_edit"),

    events : {
        "click #send" : "onSubmit"
    },

    initialize : function(){
        _.bindAll(this, "onSubmit");
        this.render();
    },
    
    render : function(){
        // Get the inputEx field definition from the "Comment" object 
        var fields = schemaBuilder.schemaToInputEx(this.options.schema);
        
//         fields.type = 'form';

        // Add 'model_edit' as parent element 
        fields.parentEl = 'model_edit';
        
        // Create the form 
        inputEx(fields);
        new inputEx.widget.Button({
            id: 'send',
            parentEl: 'model_edit',
            type: 'submit',
            onClick: this.onSubmit,
            value: 'Send'
        });
//         this.delegateEvents(); // Bind events to the rendered form elements
        return this;
    },

    // Simply takes the vals from the input fields and 
    // creates a new Comment.
    onSubmit : function(){
        var name = $("input[name='name']").val();
        var text = $("input[name='text']").val();
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
