VU.InitSchemas = function () {
/////////////////////////////////////////////////////////////////////////////
/// SCHEMAS DECLARATION ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////{
VU.halls_schema_full = {
        "description":"A dancehall is a venue dedicated to musical performances and dancing",
        "type":"object",
        "properties":{
            "_id":{
                "description": "ID",
                "type":"string",
                "format":"id",
                "optional":true,
                "_inputex": {
                    "_type": "hidden"
                }
            },
            "name":{
                "description": "Dance Hall Name",
                "type":"string",
                "required":true
            },
            "community":{
                "description": "Community",
                "type":"string",
                "optional":true
            },
            "county":{
                "description": "County",
                "type":"string",
                "optional":true
            },
            "address":{
                "description": "Address",
                "type":"string",
                "optional":true
            },
            "directions":{
                "description": "Directions",
                "type":"string",
                "optional":true
            },
            "currentUse":{
                "description": "Current Use",
                "type":"string",
                "optional":true
            },
            "culturalOrigin":{
                "description": "Cultural Origin",
                "type":"string",
                "optional":true
            },
            "numberOfStories":{
                "description": "Number of stories",
                "type":"string",
                "optional":true
            },
            "buildingForm":{
                "description": "Building Form",
                "type":"string",
                "optional":true
            },
            "typeOfConstruction":{
                "description": "Type of Construction",
                "type":"string",
                "optional":true
            },
            "dateBuilt":{
                "description": "Date Built",
                "type":"string",
                "optional":true
            },
            "certaintyOfDate":{
                "description": "Certainty of Date",
                "type":"string",
                "optional":true
            },
            "builder":{
                "description": "Builder",
                "type":"string",
                "optional":true
            },
            "currentOwner":{
                "description": "Current Owner",
                "type":"string",
                "optional":true
            },
            "contact":{
                "description": "Contact",
                "type":"string",
                "optional":true
            },
            "website":{
                "description": "Website",
                "type":"string",
                "optional":true
            },
            "description":{
                "description": "Description",
                "type":"string",
                "optional":true
            },
            "comments":{
                "description": "Comments",
                "type":"string",
                "optional":true
            },
            "historicalNarrative":{
                "description": "Historical Narrative",
                "type":"string",
                "optional":true
            },
            "yourName":{
                "description": "Your name",
                "type":"string",
                "optional":true
            },
            "yourEmail":{
                "description": "Your email",
                "type":"string",
                "optional":true
            },
            "images":{
                "description":"Images",
                "type": "array",
                "optional":true,
                "items":{
                    "type":"object",
                    "properties":{
                        "image": {
                            "description":"Image file",
                            "type":"file",
                            "enctype":"multipart/form-data",
                            "required":true,
                            "buttons": {
			        "type": "submit", 
			        "value": "Upload"
			    } 
                        },
                        "credit": {
                            "description": "Image credit",
                            "type":"string",
                            "optional":true
                        }
                    }
                }
            },
            "gpsCoordinates":{
                "description": "GPS Coordinates",
                "type":"string",
                "optional":true
            },
            "nationalRegister":{
                "description": "National Register",
                "type":"string",
                "optional":true
            },
            "mapped":{
                "description": "Mapped?",
                "type":"string",
                "optional":true
            },
            "documents":{
                "description": "Documents",
                "type":"array",
                "optional":true,
                "items":{
                    "type":"object",
                    "properties":{
                        "documentName":{
                            "description": "Document Name",
                            "type":"string",
                            "optional":true
                        },
                        "attachedReferenceDocument":{
                            "description": "Attached Reference Document",
                            "type":"file",
                            "required":true
                        },
                        "author":{
                            "description": "Author",
                            "type":"string",
                            "optional":true
                        },
                        "citation":{
                            "description": "Citation",
                            "type":"string",
                            "optional":true
                        }
                    }
                }
            }
        }
    },
   
VU.events_schema_full = {
        "description":"A basic event is an attraction, a venues, a time",
        "type":"object",
        "properties":{
            "_id":{
                "description": "ID",
                "type":"string",
                "format":"id",
                "optional":true,
                "_inputex": {
                    "_type": "hidden"
                }
            },
            "band":{
                "description": "Band ID",
                "type":"array",
                "required":true
            },
            "date":{
                "description": "Date of event",
                "type":"string",
                "optional":true
            },
            "eventType":{
                "description": "Type of event",
                "type":"string",
                "optional":true
            },
            "hall":{
                "description": "Dancehall ID",
                "type":"array",
                "required":true
            }
		}
	},
	
VU.event_schema_admin = {
        "description":"A basic event is an attraction, a venues, a time",
        "type":"object",
        "properties":{
            "bandName":{
                "description": "Band Name",
                "type":"array",
                "required":true
            },
            "date":{
                "description": "Date of event",
                "type":"string",
                "optional":true
            },
            "eventType":{
                "description": "Type of event",
                "type":"string",
                "optional":true
            },
            "hallName":{
                "description": "Dancehall Name",
                "type":"array",
                "required":true
            }
		}
	}

};