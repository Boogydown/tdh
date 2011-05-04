$(function(){
    var Schema = {};

    var Schema.Form = function () {
        alert("this is a test");
    };

    if (typeof exports !== "undefined") {
        module.exports.SchemaForm = Schema.Form;
        module.exports.SchemaTable = Schema.Table;
        module.exports.SchemaApp = Schema.App;
    }
    else {
        SchemaForm = Schema.Form;
//         SchemaTable = Schema.Table;
//         SchemaApp = Schema.App;
    }
});