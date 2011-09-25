VU.InitSchemas = function () {
/////////////////////////////////////////////////////////////////////////////
/// SCHEMAS DECLARATION /////////////////////////////////////////////////////
// These are used for UI mapping: i.e. input form and output tables, etc   //
/////////////////////////////////////////////////////////////////////////////{
VU.schemas = { 
	halls: {
		full: {
			"description":"A dancehall is a venue dedicated to musical performances and dancing",
			"type":"object",
			"properties":{
				"_id":{
					"description": "ID",
					"type":"string",
					"format":"id",
					"optional":true,
					"hidden":true,
					"_inputex": {
						"_type": "hidden"
					}
				},
				"danceHallName":{
					"description": "Dance Hall Name",
					"type":"string",
					"required":true
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
								"clickable":true,
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
					"type":"url",
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
								"clickable":true,
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
		
		member: {
			"description":"A dancehall is a venue dedicated to musical performances and dancing",
			"type":"object",
			"properties":{
				"_id":{
					"description": "ID",
					"type":"string",
					"format":"id",
					"optional":true,
					"hidden":true,
					"_inputex": {
						"_type": "hidden"
					}
				},
				"danceHallName":{
					"description": "Dance Hall Name",
					"type":"string",
					"required":true
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
								"clickable":false,
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
				"dateBuilt":{
					"description": "Date Built",
					"type":"string",
					"optional":true
				},
				"website":{
					"description": "Website",
					"type":"url",
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
								"clickable":false,
								"required":true
							}
						}
					}
				}
			}
		}
	},
	
	events: {
		full: {
			"description":"A basic event is an attraction, a venues, a time",
			"type":"object",
			"properties":{
				"band":{
					"description": "Band Name",
					"type":"string",
					"required":true,
					"linkRef": "bands",
					"hidden": true,
					"choices": [ {"value":"foo","label":"bar"} ]
				},
				"bandName":{
					"description": "Band Name",
					"type":"string",
					"required":true,
					"linkVal": { 
						linkRef: "band",
						cell: "bandName"
					},
					"_inputex": {
						"_type": "hidden"
					}					
				},
				"hall":{
					"description": "Dance Hall",
					"type":"string",
					"required": true,
					"linkRef": "halls",
					"hidden": true,
					"choices": [ {"value":"foo","label":"bar"} ]
				},
				"hallName":{
					"description": "Dance Hall Name",
					"type":"string",
					"required":true,
					"linkVal": { 
						linkRef: "hall",
						cell: "bandName"
					},
					"_inputex": {
						"_type": "hidden"
					}
				},
				"gpsCoordinates":{
					"description": "GPS coords",
					"type":"string",
					"optional":true,
					"hidden":true,
					"linkVal": { 
						linkRef: "hall",
						cell: "gpsCoordinates"
					},
					"_inputex": {
						"_type": "hidden"
					}					
				},
				"date":{
					"description": "Date of event",
					"type":"string",
					"required":true,
					//"format":"date",
					"_inputex": {
						//"_type": "datepicker", 
						//valueFormat: 'd-m-Y', 
						//label: 'Date of event'
						"value":"December 31, 2011"
					}
    			},
				"time":{
					"description": "Starts at",
					"type":"string",
					"optional":true,
					"_inputex": {
						"value":"8:00 PM"
					}
				},
				"eventType":{
					"description": "Type of event",
					"type":"string",
					"choices": [ 
						{"value":"","label":""},
						{"value":"Dance","label":"Dance"},
						{"value":"Music Show","label":"Music Show"},
						{"value":"Festival","label":"Festival"} 
					]
				},
				"ageLimit":{
					"description": "Age limit",
					"type":"string",
					"choices": [ 
						{"value":"","label":""},
						{"value":"All ages","label":"All ages"},
						{"value":"18 and up","label":"18 and up"},
						{"value":"21 and up","label":"21 and up"} 
					]
				}
			}
		},
			
		listing: {
			"description":"Display event info as part of a listing",
			"type":"object",
			"properties":{
				"band":{
					"description": "Band ID",
					"type":"string",
					"required":true,
					"linkRef": "bands"
				},
				"bandName":{
					"description": "Band Name",
					"type":"string",
					"required":true,
					"linkVal": { 
						linkRef: "band",
						cell: "bandName"
					}
				},
				"bandPic":{
					"description": "Thumbnail pic of band",
					"type":"string",
					"optional":true,
					"linkVal": {
						linkRef: "band",
						cell: "thumbPic"
					}
				},
				"date":{
					"description": "Date of event",
					"type":"string",
					"required":true
				},
				"time":{
					"description": "Starts at",
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
					"type":"string",
					"required":true,
					"linkRef": "halls"
				},
				"hallName":{
					"description": "DanceHall Name",
					"type":"string",
					"required":true,
					"linkVal": { 
						linkRef: "hall",
						cell: "danceHallName"
					}
				},
				"gpsCoordinates":{
					"description": "GPS coords",
					"type":"string",
					"optional":true,
					"hidden":true,
					"linkVal": { 
						linkRef: "hall",
						cell: "gpsCoordinates"
					},
					"_inputex": {
						"_type": "hidden"
					}					
				},
				"hallPic":{
					"description": "Thumbnail pic of a dancehall",
					"type":"string",
					"optional":true,
					"linkVal": {
						linkRef: "hall",
						cell: "thumbPic"
					}
				}
			}
		}
	},
	
	bands: {
		full: {
			"description":"A band profile",
			"type":"object",
			"properties":{
				"bandName":{
					"description": "Band Name",
					"type":"string",
					"required":true
				},
				"status":{
					"description": "Active or Inactive",
					"type":"string",
					"optional":true,
                    "choices": [
                        {"value":"Active","label":"Active"},
                        {"value":"Inactive","label":"Inactive"},
                        {"value":"Gone but Not Forgotten","label":"Gone but Not Forgotten"}
                    ]
				},
				"website":{
					"description": "Website for more info",
					"type":"string",
					"optional":true
				},
				"stylesPlayed":{
					"description": "What are the different styles played",
					"type":"array",
					"optional":true,
					"items": {
						"type":"string",
                        choices: [
                            { value: "Tejano", label: "Tejano" },
                            { value: "Rock & Roll", label: "Rock & Roll" },
                            { value: "Polka", label: "Polka" },
                            { value: "R&B/Soul", label: "R&B/Soul" },
                            { value: "Honky Tonk", label: "Honky Tonk" },
                            { value: "Western Swing", label: "Western Swing" },
                            { value: "Cajun/Zydeco", label: "Cajun/Zydeco" },
                            { value: "Rockabilly", label: "Rockabilly" },
                            { value: "Singer/Songwriter", label: "Singer/Songwriter" },
                            { value: "Blues", label: "Blues" },
                            { value: "Countryk", label: "Country" }
                        ]
					}
				}
			}
		}
	}
};
};