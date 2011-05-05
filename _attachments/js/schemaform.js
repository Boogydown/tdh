var schemaIdentifierMap = {
    "Comment" : {
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
    }
};

var schemaBuilder = new inputEx.JsonSchema.Builder({ 
    'schemaIdentifierMap': schemaIdentifierMap 
}); 


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
        var inputExDefinition = schemaBuilder.schemaToInputEx(schemaIdentifierMap["Comment"]);

//         // Add 'container1' as parent element 
//         inputExDefinition.parentEl = 'container1';

        // Create the form 
        var f = inputEx(inputExDefinition);
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
