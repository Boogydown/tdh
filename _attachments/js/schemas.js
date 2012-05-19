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
					"hidden":true,
					"_inputex": {
						"_type": "hidden"
					}
				},
				"_rev":{
					"description": "Revision",
					"type":"string",
					"format":"id",
					"hidden":true,
					"_inputex": {
						"_type": "hidden"
					}
				},
				"danceHallName":{
					"description": "Dance Hall Name",
					"type":"string",
					"required":true,
					"_inputex":{
						"size":80
					}
				},
				"images":{
					"description":"Images",
					"type": "array",
					"optional":true,
					"items":{
						"type":"object",
						"properties":{
							"_attachments_stub": {
								"description": "Image file",
								"type":"file",
								"clickable":true,
								"enctype":"multipart/form-data",
								"required":true,
								"buttons": {
									"type": "submit", 
									"value": "Upload"
								},
								"_inputex": {
									"label": "Image file",
									"className": "sF_image"
								}
							},
							"image": {
								"description": "Image Url",
								"type":"string",
								"optional":true,
								"readonly":true,
								"_inputex": {
									"label": "Image URL",
									typeInvite: "(auto-filled; do not edit)",
									size:26
								},
								"picUrl":true,
								clickable:true
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
					"required":true,
					"choices": [ 
						{'value':'','label':''},
						{'value':'Anderson','label':'Anderson'},
						{'value':'Andrews','label':'Andrews'},
						{'value':'Angelina','label':'Angelina'},
						{'value':'Aransas','label':'Aransas'},
						{'value':'Archer','label':'Archer'},
						{'value':'Armstrong','label':'Armstrong'},
						{'value':'Atascosa','label':'Atascosa'},
						{'value':'Austin','label':'Austin'},
						{'value':'Bailey','label':'Bailey'},
						{'value':'Bandera','label':'Bandera'},
						{'value':'Bastrop','label':'Bastrop'},
						{'value':'Baylor','label':'Baylor'},
						{'value':'Bee','label':'Bee'},
						{'value':'Bell','label':'Bell'},
						{'value':'Bexar','label':'Bexar'},
						{'value':'Blanco','label':'Blanco'},
						{'value':'Borden','label':'Borden'},
						{'value':'Bosque','label':'Bosque'},
						{'value':'Bowie','label':'Bowie'},
						{'value':'Brazoria','label':'Brazoria'},
						{'value':'Brazos','label':'Brazos'},
						{'value':'Brewster','label':'Brewster'},
						{'value':'Briscoe','label':'Briscoe'},
						{'value':'Brooks','label':'Brooks'},
						{'value':'Brown','label':'Brown'},
						{'value':'Burleson','label':'Burleson'},
						{'value':'Burnet','label':'Burnet'},
						{'value':'Caldwell','label':'Caldwell'},
						{'value':'Calhoun','label':'Calhoun'},
						{'value':'Callahan','label':'Callahan'},
						{'value':'Cameron','label':'Cameron'},
						{'value':'Camp','label':'Camp'},
						{'value':'Carson','label':'Carson'},
						{'value':'Cass','label':'Cass'},
						{'value':'Castro','label':'Castro'},
						{'value':'Chambers','label':'Chambers'},
						{'value':'Cherokee','label':'Cherokee'},
						{'value':'Childress','label':'Childress'},
						{'value':'Clay','label':'Clay'},
						{'value':'Cochran','label':'Cochran'},
						{'value':'Coke','label':'Coke'},
						{'value':'Coleman','label':'Coleman'},
						{'value':'Collin','label':'Collin'},
						{'value':'Collingsworth','label':'Collingsworth'},
						{'value':'Colorado','label':'Colorado'},
						{'value':'Comal','label':'Comal'},
						{'value':'Comanche','label':'Comanche'},
						{'value':'Concho','label':'Concho'},
						{'value':'Cooke','label':'Cooke'},
						{'value':'Coryell','label':'Coryell'},
						{'value':'Cottle','label':'Cottle'},
						{'value':'Crane','label':'Crane'},
						{'value':'Crockett','label':'Crockett'},
						{'value':'Crosby','label':'Crosby'},
						{'value':'Culberson','label':'Culberson'},
						{'value':'Dallam','label':'Dallam'},
						{'value':'Dallas','label':'Dallas'},
						{'value':'Dawson','label':'Dawson'},
						{'value':'Deaf Smith','label':'Deaf Smith'},
						{'value':'Delta','label':'Delta'},
						{'value':'Denton','label':'Denton'},
						{'value':'Dewitt','label':'Dewitt'},
						{'value':'Dickens','label':'Dickens'},
						{'value':'Dimmit','label':'Dimmit'},
						{'value':'Donley','label':'Donley'},
						{'value':'Duval','label':'Duval'},
						{'value':'Eastland','label':'Eastland'},
						{'value':'Ector','label':'Ector'},
						{'value':'Edwards','label':'Edwards'},
						{'value':'El Paso','label':'El Paso'},
						{'value':'Ellis','label':'Ellis'},
						{'value':'Erath','label':'Erath'},
						{'value':'Falls','label':'Falls'},
						{'value':'Fannin','label':'Fannin'},
						{'value':'Fayette','label':'Fayette'},
						{'value':'Fisher','label':'Fisher'},
						{'value':'Floyd','label':'Floyd'},
						{'value':'Foard','label':'Foard'},
						{'value':'Fort Bend','label':'Fort Bend'},
						{'value':'Franklin','label':'Franklin'},
						{'value':'Freestone','label':'Freestone'},
						{'value':'Frio','label':'Frio'},
						{'value':'Gaines','label':'Gaines'},
						{'value':'Galveston','label':'Galveston'},
						{'value':'Garza','label':'Garza'},
						{'value':'Gillespie','label':'Gillespie'},
						{'value':'Glasscock','label':'Glasscock'},
						{'value':'Goliad','label':'Goliad'},
						{'value':'Gonzales','label':'Gonzales'},
						{'value':'Gray','label':'Gray'},
						{'value':'Grayson','label':'Grayson'},
						{'value':'Gregg','label':'Gregg'},
						{'value':'Grimes','label':'Grimes'},
						{'value':'Guadalupe','label':'Guadalupe'},
						{'value':'Hale','label':'Hale'},
						{'value':'Hall','label':'Hall'},
						{'value':'Hamilton','label':'Hamilton'},
						{'value':'Hansford','label':'Hansford'},
						{'value':'Hardeman','label':'Hardeman'},
						{'value':'Hardin','label':'Hardin'},
						{'value':'Harris','label':'Harris'},
						{'value':'Harrison','label':'Harrison'},
						{'value':'Hartley','label':'Hartley'},
						{'value':'Haskell','label':'Haskell'},
						{'value':'Hays','label':'Hays'},
						{'value':'Hemphill','label':'Hemphill'},
						{'value':'Henderson','label':'Henderson'},
						{'value':'Hidalgo','label':'Hidalgo'},
						{'value':'Hill','label':'Hill'},
						{'value':'Hockley','label':'Hockley'},
						{'value':'Hood','label':'Hood'},
						{'value':'Hopkins','label':'Hopkins'},
						{'value':'Houston','label':'Houston'},
						{'value':'Howard','label':'Howard'},
						{'value':'Hudspeth','label':'Hudspeth'},
						{'value':'Hunt','label':'Hunt'},
						{'value':'Hutchinson','label':'Hutchinson'},
						{'value':'Irion','label':'Irion'},
						{'value':'Jack','label':'Jack'},
						{'value':'Jackson','label':'Jackson'},
						{'value':'Jasper','label':'Jasper'},
						{'value':'Jeff Davis','label':'Jeff Davis'},
						{'value':'Jefferson','label':'Jefferson'},
						{'value':'Jim Hogg','label':'Jim Hogg'},
						{'value':'Jim Wells','label':'Jim Wells'},
						{'value':'Johnson','label':'Johnson'},
						{'value':'Jones','label':'Jones'},
						{'value':'Karnes','label':'Karnes'},
						{'value':'Kaufman','label':'Kaufman'},
						{'value':'Kendall','label':'Kendall'},
						{'value':'Kenedy','label':'Kenedy'},
						{'value':'Kent','label':'Kent'},
						{'value':'Kerr','label':'Kerr'},
						{'value':'Kimble','label':'Kimble'},
						{'value':'King','label':'King'},
						{'value':'Kinney','label':'Kinney'},
						{'value':'Kleberg','label':'Kleberg'},
						{'value':'Knox','label':'Knox'},
						{'value':'Lamar','label':'Lamar'},
						{'value':'Lamb','label':'Lamb'},
						{'value':'Lampasas','label':'Lampasas'},
						{'value':'La','label':'La'},
						{'value':'Lavaca','label':'Lavaca'},
						{'value':'Lee','label':'Lee'},
						{'value':'Leon','label':'Leon'},
						{'value':'Liberty','label':'Liberty'},
						{'value':'Limestone','label':'Limestone'},
						{'value':'Lipscomb','label':'Lipscomb'},
						{'value':'Live Oak','label':'Live Oak'},
						{'value':'Llano','label':'Llano'},
						{'value':'Loving','label':'Loving'},
						{'value':'Lubbock','label':'Lubbock'},
						{'value':'Lynn','label':'Lynn'},
						{'value':'Madison','label':'Madison'},
						{'value':'Marion','label':'Marion'},
						{'value':'Martin','label':'Martin'},
						{'value':'Mason','label':'Mason'},
						{'value':'Matagorda','label':'Matagorda'},
						{'value':'Maverick','label':'Maverick'},
						{'value':'McCulloch','label':'McCulloch'},
						{'value':'McLennan','label':'McLennan'},
						{'value':'McMullen','label':'McMullen'},
						{'value':'Medina','label':'Medina'},
						{'value':'Menard','label':'Menard'},
						{'value':'Midland','label':'Midland'},
						{'value':'Milam','label':'Milam'},
						{'value':'Mills','label':'Mills'},
						{'value':'Mitchell','label':'Mitchell'},
						{'value':'Montague','label':'Montague'},
						{'value':'Montgomery','label':'Montgomery'},
						{'value':'Moore','label':'Moore'},
						{'value':'Morris','label':'Morris'},
						{'value':'Motley','label':'Motley'},
						{'value':'Nacogdoches','label':'Nacogdoches'},
						{'value':'Navarro','label':'Navarro'},
						{'value':'Newton','label':'Newton'},
						{'value':'Nolan','label':'Nolan'},
						{'value':'Nueces','label':'Nueces'},
						{'value':'Ochiltree','label':'Ochiltree'},
						{'value':'Oldham','label':'Oldham'},
						{'value':'Orange','label':'Orange'},
						{'value':'Palo Pinto','label':'Palo Pinto'},
						{'value':'Panola','label':'Panola'},
						{'value':'Parker','label':'Parker'},
						{'value':'Parmer','label':'Parmer'},
						{'value':'Pecos','label':'Pecos'},
						{'value':'Polk','label':'Polk'},
						{'value':'Potter','label':'Potter'},
						{'value':'Presidio','label':'Presidio'},
						{'value':'Rains','label':'Rains'},
						{'value':'Randall','label':'Randall'},
						{'value':'Reagan','label':'Reagan'},
						{'value':'Real','label':'Real'},
						{'value':'Red River','label':'Red River'},
						{'value':'Reeves','label':'Reeves'},
						{'value':'Refugio','label':'Refugio'},
						{'value':'Roberts','label':'Roberts'},
						{'value':'Robertson','label':'Robertson'},
						{'value':'Rockwall','label':'Rockwall'},
						{'value':'Runnels','label':'Runnels'},
						{'value':'Rusk','label':'Rusk'},
						{'value':'Sabine','label':'Sabine'},
						{'value':'San Augustine','label':'San Augustine'},
						{'value':'San Jacinto','label':'San Jacinto'},
						{'value':'San Patricio','label':'San Patricio'},
						{'value':'San Saba','label':'San Saba'},
						{'value':'Schleicher','label':'Schleicher'},
						{'value':'Scurry','label':'Scurry'},
						{'value':'Shackelford','label':'Shackelford'},
						{'value':'Shelby','label':'Shelby'},
						{'value':'Sherman','label':'Sherman'},
						{'value':'Smith','label':'Smith'},
						{'value':'Somervell','label':'Somervell'},
						{'value':'Starr','label':'Starr'},
						{'value':'Stephens','label':'Stephens'},
						{'value':'Sterling','label':'Sterling'},
						{'value':'Stonewall','label':'Stonewall'},
						{'value':'Sutton','label':'Sutton'},
						{'value':'Swisher','label':'Swisher'},
						{'value':'Tarrant','label':'Tarrant'},
						{'value':'Taylor','label':'Taylor'},
						{'value':'Terrell','label':'Terrell'},
						{'value':'Terry','label':'Terry'},
						{'value':'Throckmorton','label':'Throckmorton'},
						{'value':'Titus','label':'Titus'},
						{'value':'Tom Green','label':'Tom Green'},
						{'value':'Travis','label':'Travis'},
						{'value':'Trinity','label':'Trinity'},
						{'value':'Tyler','label':'Tyler'},
						{'value':'Upshur','label':'Upshur'},
						{'value':'Upton','label':'Upton'},
						{'value':'Uvalde','label':'Uvalde'},
						{'value':'Val Verde','label':'Val Verde'},
						{'value':'Van Zandt','label':'Van Zandt'},
						{'value':'Victoria','label':'Victoria'},
						{'value':'Walker','label':'Walker'},
						{'value':'Waller','label':'Waller'},
						{'value':'Ward','label':'Ward'},
						{'value':'Washington','label':'Washington'},
						{'value':'Webb','label':'Webb'},
						{'value':'Wharton','label':'Wharton'},
						{'value':'Wheeler','label':'Wheeler'},
						{'value':'Wichita','label':'Wichita'},
						{'value':'Wilbarger','label':'Wilbarger'},
						{'value':'Willacy','label':'Willacy'},
						{'value':'Williamson','label':'Williamson'},
						{'value':'Wilson','label':'Wilson'},
						{'value':'Winkler','label':'Winkler'},
						{'value':'Wise','label':'Wise'},
						{'value':'Wood','label':'Wood'},
						{'value':'Yoakum','label':'Yoakum'},
						{'value':'Young','label':'Young'},
						{'value':'Zapata','label':'Zapata'},
						{'value':'Zavala','label':'Zavala'}
					]
				},
				"address":{
					"description": "Address",
					"type":"string",
					"format":"text",
					"optional":true,
					"_inputex":{
						rows:3,
						cols:50
					}
				},
				"directions":{
					"description": "Directions",
					"type":"string",
					"format":"text",
					"optional":true,
					"_inputex":{
						rows:2,
						cols:50
					}
				},
				"currentUse":{
					"description": "Current Use",
					"type":"string",
					"optional":true,
					choices: [
						{ value: "", 'label': "" },
						{ value: "Bar", 'label': "Bar" },
						{ value: "Church Hall", 'label': "Church Hall" },
						{ value: "Church services", 'label': "Church services" },
						{ value: "Commercial", 'label': "Commercial" },
						{ value: "Community center", 'label': "Community center" },
						{ value: "Dwelling", 'label': "Dwelling" },
						{ value: "Event rental", 'label': "Event rental" },
						{ value: "Gone", 'label': "Gone" },
						{ value: "Lodging", 'label': "Lodging" },
						{ value: "Public dances", 'label': "Public dances" },
						{ value: "Restaurant", 'label': "Restaurant" },
						{ value: "Retail", 'label': "Retail" },
						{ value: "Social club", 'label': "Social club" },
						{ value: "Storage", 'label': "Storage" },
						{ value: "Theater", 'label': "Theater" },
						{ value: "Unknown", 'label': "Unknown" },
						{ value: "Vacant", 'label': "Vacant" }
					]
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
					"format":"text",
					"optional":true,
					"_inputex":{
						"rows":8,
						"cols":80
					}
				},
				"comments":{
					"description": "Comments",
					"type":"string",
					"format":"text",
					"optional":true,
					"_inputex":{
						"rows":2,
						"cols":50
					}
				},
				"historicalNarrative":{
					"description": "Historical Narrative",
					"type":"string",
					"format":"text",
					"optional":true,
					"_inputex":{
						"rows":12,
						"cols":80
					}
				},
				"yourName":{
					"description": "Your name",
					"type":"string",
					"optional":true
				},
				"yourEmail":{
					"description": "Your email",
					"type":"string",
					"optional":true,
					"_inputex":{
						size:40
					}
				},
				"gpsCoordinates":{
					"description": "GPS Coordinates",
					"type":"string",
					"optional":true,
					"_inputex":{
						typeInvite: "long latt (i.e. -96.962776 31.813215)",
						size:40
					}
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
							"_attachments_stub":{
								"description": "Attached Reference Document",
								"type":"file",
								"clickable":true,
								"required":true,
								"_inputex": {
									"label": "Document",
									"className": "sF_doc"
								}
							},
							"attachedReferenceDocument": {
								"description": "Document Url",
								"type":"string",
								"optional":true,
								"readonly":true,
								"_inputex": {
									label: "Document Url",
									typeInvite: "(auto-filled; do not edit)",
									size:26
								},
								"picUrl":true
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
				},
				"ownerUsers":{
					"type": "array",
					"optional":true,
					"items":{
						"type":"string",
						"linkRef": "_users",
						"choices": [ {"value":"unauthorized","label":"You are not authorized to see this list"} ]
					},
					"_inputex": {
						"label": "Owner users"
					}					
				}				
			}
		},
		
		mini: {
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
				"images":{
					"description":"Image",
					"type": "array",
					"optional":true,
					"items":{
						"type":"object",
						"properties":{
							"image": {
								"description": "Image Url",
								"type":"string",
								"optional":true,
								"readonly":true,
								"_inputex": {
									"label": "Image URL",
									typeInvite: "(auto-filled; do not edit)",
									size:26
								},
								"picUrl":true,
								clickable: false
							}
						}
					},
					clickable: false,
					takeOne: true					
				},
				"danceHallName":{
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
				"dateBuilt":{
					"description": "Date Built",
					"type":"string",
					"optional":true
				}
			}
		},
		
		app: {
			"description":"A dancehall is a venue dedicated to musical performances and dancing",
			"type":"object",
			"properties":{
				"publicContactPhone":{
					"type":"string",
					"optional":true,
					"_inputex": {
						"label": "Public Contact: phone"
					}
				},
				"publicContactEmail":{
					"type":"string",
					"optional":true,					
					"_inputex": {
						"label": "Public Contact: email"
					}
				},
				"address":{
					"optional":true,
					"type":"string",
					"_inputex": {
						"label": "Street Address",
						"size":40
					}
				},
				"mailingAddress":{
					"type":"string",
					"optional":true,
					"_inputex": {
						"label": "Mailing Address",
						"size":40
					}
				},
				"website":{
					"type":"url",
					"optional":true,
					"_inputex": {
						"label": "Website"
					}
				},
				"currentOwner":{
					"type":"string",
					"optional":true,
					"_inputex": {
						"label": "Current Owner"
					}
				},
				"currentOwnerAddress":{
					"type":"string",
					"optional":true,
					"_inputex": {
						"label": "Current Owner's Address",
						"size":40
					}					
				},
				"currentOwnerPhone":{
					"type":"string",
					"optional":true,
					"_inputex": {
						"label": "Current Owner's Phone"
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
					"type":"string",
					"required":true,
					"linkRef": "bands",
					"hidden": true,
					"choices": [ {"value":"foo","label":"bar"} ],
					"_inputex": {
						"label": "Band"
					}
				},
				"bandName":{
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
					"type":"string",
					"required": true,
					"linkRef": "halls",
					"hidden": true,
					"choices": [ {"value":"foo","label":"bar"} ],
					"_inputex": {
						"label": "Dance Hall"
					}
				},
				"hallName":{
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
					"type":"string",
					"required":true,
					//"format":"date",
					"_inputex": {
						//"_type": "datepicker", 
						//valueFormat: 'd-m-Y', 
						label: 'Date of event'
						//"value":"December 31, 2011"
					}
    			},
				"time":{
					"type":"string",
					"optional":true,
					"choices": [ 
						{'value':'TBA','label':'TBA'},
						{'value':'12:00 AM','label':'12:00 AM'},
						{'value':'12:30 AM','label':'12:30 AM'},
						{'value':'1:00 AM','label':'1:00 AM'},
						{'value':'1:30 AM','label':'1:30 AM'},
						{'value':'2:00 AM','label':'2:00 AM'},
						{'value':'2:30 AM','label':'2:30 AM'},
						{'value':'3:00 AM','label':'3:00 AM'},
						{'value':'3:30 AM','label':'3:30 AM'},
						{'value':'4:00 AM','label':'4:00 AM'},
						{'value':'4:30 AM','label':'4:30 AM'},
						{'value':'5:00 AM','label':'5:00 AM'},
						{'value':'5:30 AM','label':'5:30 AM'},
						{'value':'6:00 AM','label':'6:00 AM'},
						{'value':'6:30 AM','label':'6:30 AM'},
						{'value':'7:00 AM','label':'7:00 AM'},
						{'value':'7:30 AM','label':'7:30 AM'},
						{'value':'8:00 AM','label':'8:00 AM'},
						{'value':'8:30 AM','label':'8:30 AM'},
						{'value':'9:00 AM','label':'9:00 AM'},
						{'value':'9:30 AM','label':'9:30 AM'},
						{'value':'10:00 AM','label':'10:00 AM'},
						{'value':'10:30 AM','label':'10:30 AM'},
						{'value':'11:00 AM','label':'11:00 AM'},
						{'value':'11:30 AM','label':'11:30 AM'},
						{'value':'12:00 PM','label':'12:00 PM'},
						{'value':'12:30 PM','label':'12:30 PM'},
						{'value':'1:00 PM','label':'1:00 PM'},
						{'value':'1:30 PM','label':'1:30 PM'},
						{'value':'2:00 PM','label':'2:00 PM'},
						{'value':'2:30 PM','label':'2:30 PM'},
						{'value':'3:00 PM','label':'3:00 PM'},
						{'value':'3:30 PM','label':'3:30 PM'},
						{'value':'4:00 PM','label':'4:00 PM'},
						{'value':'4:30 PM','label':'4:30 PM'},
						{'value':'5:00 PM','label':'5:00 PM'},
						{'value':'5:30 PM','label':'5:30 PM'},
						{'value':'6:00 PM','label':'6:00 PM'},
						{'value':'6:30 PM','label':'6:30 PM'},
						{'value':'7:00 PM','label':'7:00 PM'},
						{'value':'7:30 PM','label':'7:30 PM'},
						{'value':'8:00 PM','label':'8:00 PM'},
						{'value':'8:30 PM','label':'8:30 PM'},
						{'value':'9:00 PM','label':'9:00 PM'},
						{'value':'9:30 PM','label':'9:30 PM'},
						{'value':'10:00 PM','label':'10:00 PM'},
						{'value':'10:30 PM','label':'10:30 PM'},
						{'value':'11:00 PM','label':'11:00 PM'},
						{'value':'11:30 PM','label':'11:30 PM'}
					],
					"_inputex": {
						"value":"8:00 PM",
						"label":"Starts at"
					}
				},
				"eventType":{
					"type":"string",
					"choices": [ 
						{"value":"","label":""},
						{"value":"Dance","label":"Dance"},
						{"value":"Music Show","label":"Music Show"},
						{"value":"Festival","label":"Festival"} 
					],
					"_inputex": {
						"label": "Type of event"
					}
				},
				"ageLimit":{
					"type":"string",
					"choices": [ 
						{"value":"","label":""},
						{"value":"All ages","label":"All ages"},
						{"value":"18 and up","label":"18 and up"},
						{"value":"21 and up","label":"21 and up"} 
					],
					"_inputex": {
						"label": "Age limit"
					}
				},
				"admission":{
					"type":"string",
					"_inputex": {
						"label": "Admission",
						"value":"$"
					}
				},
				"_rev":{
					"description": "Revision",
					"type":"string",
					"format":"id",
					"hidden":true,
					"_inputex": {
						"_type": "hidden"
					}
				},
				"ownerUsers":{
					"type": "array",
					"optional":true,
					"items":{
						"type":"string",
						"linkRef": "_users",
						"choices": [ {"value":"unauthorized","label":"You are not authorized to see this list"} ]
					},
					"_inputex": {
						"label": "Owner users"
					}
				}				
			}
		},
		
		full_app: {
			"description":"A basic event is an attraction, a venues, a time",
			"type":"object",
			"properties":{
				"band":{
					"type":"string",
					"required":true,
					"linkRef": "bands",
					"hidden": true,
					"choices": [ {"value":"foo","label":"bar"} ],
					"_inputex": {
						"label": "Band"
					}
				},
				"bandName":{
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
					"type":"string",
					"required": true,
					"linkRef": "halls",
					"hidden": true,
					"choices": [ {"value":"foo","label":"bar"} ],
					"_inputex": {
						"label": "Dance Hall"
					}
				},
				"hallName":{
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
					"type":"string",
					"required":true,
					//"format":"date",
					"_inputex": {
						//"_type": "datepicker", 
						//valueFormat: 'd-m-Y', 
						label: 'Date of event'
						//"value":"December 31, 2011"
					}
    			},
				"time":{
					"type":"string",
					"optional":true,
					"choices": [ 
						{'value':'TBA','label':'TBA'},
						{'value':'12:00 AM','label':'12:00 AM'},
						{'value':'12:30 AM','label':'12:30 AM'},
						{'value':'1:00 AM','label':'1:00 AM'},
						{'value':'1:30 AM','label':'1:30 AM'},
						{'value':'2:00 AM','label':'2:00 AM'},
						{'value':'2:30 AM','label':'2:30 AM'},
						{'value':'3:00 AM','label':'3:00 AM'},
						{'value':'3:30 AM','label':'3:30 AM'},
						{'value':'4:00 AM','label':'4:00 AM'},
						{'value':'4:30 AM','label':'4:30 AM'},
						{'value':'5:00 AM','label':'5:00 AM'},
						{'value':'5:30 AM','label':'5:30 AM'},
						{'value':'6:00 AM','label':'6:00 AM'},
						{'value':'6:30 AM','label':'6:30 AM'},
						{'value':'7:00 AM','label':'7:00 AM'},
						{'value':'7:30 AM','label':'7:30 AM'},
						{'value':'8:00 AM','label':'8:00 AM'},
						{'value':'8:30 AM','label':'8:30 AM'},
						{'value':'9:00 AM','label':'9:00 AM'},
						{'value':'9:30 AM','label':'9:30 AM'},
						{'value':'10:00 AM','label':'10:00 AM'},
						{'value':'10:30 AM','label':'10:30 AM'},
						{'value':'11:00 AM','label':'11:00 AM'},
						{'value':'11:30 AM','label':'11:30 AM'},
						{'value':'12:00 PM','label':'12:00 PM'},
						{'value':'12:30 PM','label':'12:30 PM'},
						{'value':'1:00 PM','label':'1:00 PM'},
						{'value':'1:30 PM','label':'1:30 PM'},
						{'value':'2:00 PM','label':'2:00 PM'},
						{'value':'2:30 PM','label':'2:30 PM'},
						{'value':'3:00 PM','label':'3:00 PM'},
						{'value':'3:30 PM','label':'3:30 PM'},
						{'value':'4:00 PM','label':'4:00 PM'},
						{'value':'4:30 PM','label':'4:30 PM'},
						{'value':'5:00 PM','label':'5:00 PM'},
						{'value':'5:30 PM','label':'5:30 PM'},
						{'value':'6:00 PM','label':'6:00 PM'},
						{'value':'6:30 PM','label':'6:30 PM'},
						{'value':'7:00 PM','label':'7:00 PM'},
						{'value':'7:30 PM','label':'7:30 PM'},
						{'value':'8:00 PM','label':'8:00 PM'},
						{'value':'8:30 PM','label':'8:30 PM'},
						{'value':'9:00 PM','label':'9:00 PM'},
						{'value':'9:30 PM','label':'9:30 PM'},
						{'value':'10:00 PM','label':'10:00 PM'},
						{'value':'10:30 PM','label':'10:30 PM'},
						{'value':'11:00 PM','label':'11:00 PM'},
						{'value':'11:30 PM','label':'11:30 PM'}
					],
					"_inputex": {
						"value":"8:00 PM",
						"label":"Starts at"
					}
				},
				"eventType":{
					"type":"string",
					"choices": [ 
						{"value":"","label":""},
						{"value":"Dance","label":"Dance"},
						{"value":"Music Show","label":"Music Show"},
						{"value":"Festival","label":"Festival"} 
					],
					"_inputex": {
						"label": "Type of event"
					}
				},
				"ageLimit":{
					"type":"string",
					"choices": [ 
						{"value":"","label":""},
						{"value":"All ages","label":"All ages"},
						{"value":"18 and up","label":"18 and up"},
						{"value":"21 and up","label":"21 and up"} 
					],
					"_inputex": {
						"label": "Age limit"
					}
				},
				"admission":{
					"type":"string",
					"_inputex": {
						"label": "Admission",
						"value":"$"
					}
				},
				"_rev":{
					"description": "Revision",
					"type":"string",
					"format":"id",
					"hidden":true,
					"_inputex": {
						"_type": "hidden"
					}
				}				
			}
		},
		
		admin: {
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
					"choices": [ 
						{'value':'TBA','label':'TBA'},
						{'value':'12:00 AM','label':'12:00 AM'},
						{'value':'12:30 AM','label':'12:30 AM'},
						{'value':'1:00 AM','label':'1:00 AM'},
						{'value':'1:30 AM','label':'1:30 AM'},
						{'value':'2:00 AM','label':'2:00 AM'},
						{'value':'2:30 AM','label':'2:30 AM'},
						{'value':'3:00 AM','label':'3:00 AM'},
						{'value':'3:30 AM','label':'3:30 AM'},
						{'value':'4:00 AM','label':'4:00 AM'},
						{'value':'4:30 AM','label':'4:30 AM'},
						{'value':'5:00 AM','label':'5:00 AM'},
						{'value':'5:30 AM','label':'5:30 AM'},
						{'value':'6:00 AM','label':'6:00 AM'},
						{'value':'6:30 AM','label':'6:30 AM'},
						{'value':'7:00 AM','label':'7:00 AM'},
						{'value':'7:30 AM','label':'7:30 AM'},
						{'value':'8:00 AM','label':'8:00 AM'},
						{'value':'8:30 AM','label':'8:30 AM'},
						{'value':'9:00 AM','label':'9:00 AM'},
						{'value':'9:30 AM','label':'9:30 AM'},
						{'value':'10:00 AM','label':'10:00 AM'},
						{'value':'10:30 AM','label':'10:30 AM'},
						{'value':'11:00 AM','label':'11:00 AM'},
						{'value':'11:30 AM','label':'11:30 AM'},
						{'value':'12:00 PM','label':'12:00 PM'},
						{'value':'12:30 PM','label':'12:30 PM'},
						{'value':'1:00 PM','label':'1:00 PM'},
						{'value':'1:30 PM','label':'1:30 PM'},
						{'value':'2:00 PM','label':'2:00 PM'},
						{'value':'2:30 PM','label':'2:30 PM'},
						{'value':'3:00 PM','label':'3:00 PM'},
						{'value':'3:30 PM','label':'3:30 PM'},
						{'value':'4:00 PM','label':'4:00 PM'},
						{'value':'4:30 PM','label':'4:30 PM'},
						{'value':'5:00 PM','label':'5:00 PM'},
						{'value':'5:30 PM','label':'5:30 PM'},
						{'value':'6:00 PM','label':'6:00 PM'},
						{'value':'6:30 PM','label':'6:30 PM'},
						{'value':'7:00 PM','label':'7:00 PM'},
						{'value':'7:30 PM','label':'7:30 PM'},
						{'value':'8:00 PM','label':'8:00 PM'},
						{'value':'8:30 PM','label':'8:30 PM'},
						{'value':'9:00 PM','label':'9:00 PM'},
						{'value':'9:30 PM','label':'9:30 PM'},
						{'value':'10:00 PM','label':'10:00 PM'},
						{'value':'10:30 PM','label':'10:30 PM'},
						{'value':'11:00 PM','label':'11:00 PM'},
						{'value':'11:30 PM','label':'11:30 PM'}
					],
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
				},
				"admission":{
					"description": "Admission $",
					"type":"string"
				},
				"featured":{
					"description": "Featured listing",
					"type":"boolean"
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
		},
			
		mini: {
			"description":"Display event info as part of a listing",
			"type":"object",
			"properties":{
				"band":{
					"description": "Band ID",
					"type":"string",
					"required":true,
					"linkRef": "bands",
					hidden:true
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
				"hall":{
					"description": "Dancehall ID",
					"type":"string",
					"required":true,
					"linkRef": "halls",
					hidden:true
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
				"ageLimit":{
					"description": "Age limit",
					"type":"string"
				},
				"admission":{
					"description": "Admission",
					"type":"string"
				},
				"eventType":{
					"description": "Type of event",
					"type":"string",
					"optional":true
				}
			}
		}
	},
	
	bands: {
		full: {
			"description":"A band profile",
			"type":"object",
			"properties":{
				"_rev":{
					"description": "Revision",
					"type":"string",
					"format":"id",
					"hidden":true,
					"_inputex": {
						"_type": "hidden"
					}
				},
				"bandName":{
					"type":"string",
					"required":true,
					"_inputex": {
						"label": "Band Name",
						"size":40
					}
				},
				"status":{
					"type":"string",
					"optional":true,
                    "choices": [
                        {"value":"Active","label":"Active"},
                        {"value":"Not currently active","label":"Not currently active"},
                        {"value":"Gone but not forgotten","label":"Gone but not forgotten"}
                    ],
					"_inputex": {
						"label": "Status"
					}
				},
				"website":{
					"type":"url",
					"optional":true,
					"_inputex": {
						"label": "Band website"
					}					
				},
				"_attachments":{
					"type":"file",
					"clickable":true,
					"enctype":"multipart/form-data",
					"optional":true,
					hidden:true,
					"_inputex": {
						"label": "Image"
					}
				},	
				"image":{
					"type":"string",
					"optional":true,
					"_inputex": {
						"label": "Image Url"
					},
					"readonly":true,
					"picUrl":true
				},
				"stylesPlayed":{
					"type":"array",
					"required":true,
					"items": {
						"type":"string",
                        choices: [
                            { value: "", label: "" },
                            { value: "Americana", label: "Americana" },
                            { value: "Big Band", label: "Big Band" },
                            { value: "Blues", label: "Blues" },
                            { value: "Cajun-Zydeco", label: "Cajun-Zydeco" },
                            { value: "Country", label: "Country" },
                            { value: "Honky Tonk", label: "Honky Tonk" },
                            { value: "New Country", label: "New Country" },
                            { value: "Orchestra", label: "Orchestra" },
                            { value: "Polka", label: "Polka" },
                            { value: "R&B-Soul", label: "R&B-Soul" },
                            { value: "Rock", label: "Rock" },
                            { value: "Rock & Roll", label: "Rock & Roll" },
                            { value: "Rockabilly", label: "Rockabilly" },
                            { value: "Singer-Songwriter", label: "Singer-Songwriter" },
                            { value: "Tejano", label: "Tejano" },
                            { value: "Variety", label: "Variety" },
                            { value: "Western Swing", label: "Western Swing" }
                        ]
					},
					"_inputex": {
						"label": "Different styles played:"
					}
				},
				"area":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Area/Region"
					}					
				},
				"contactName":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Contact Name",
						"size": 40
					}					
				},
				"phone":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Phone"
					}					
				},
				"email":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "E-Mail",
						"size": 40
					}					
				},
				"yearFounded":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Year Founded"
					}					
				},
				"bandHistory":{
					"type": "string",
					"format":"text",
					"optional":true,
					"_inputex":{
						"label": "Band History",
						"rows":4,
						"cols":60
					}
				},
				"hallsPlayed":{
					"type": "array",
					"optional":true,
					"items": {
						"type":"string"
					},
					"_inputex": {
						"label": "Halls Played"
					}
				},
				"ownerUsers":{
					"type": "array",
					"optional":true,
					"items":{
						"type":"string",
						"linkRef": "_users",
						"choices": [ {"value":"unauthorized","label":"You are not authorized to see this list"} ]
					},
					"_inputex": {
						"label": "Owner users"
					}
				}				
			}
		},
		
		mini: {
			"description":"A band profile",
			"type":"object",
			"properties":{
				"image":{
					description: "Image",
					"type":"string",
					"optional":true,
					"_inputex": {
						"label": "Image Url"
					},
					"readonly":true,
					"picUrl":true
				},
				"bandName":{
					description: "Band name",
					"type":"string",
					"required":true,
					"_inputex": {
						"label": "Band Name",
						"size":40
					}
				},
				"status":{
					description: "Status",
					"type":"string",
					"optional":true,
                    "choices": [
                        {"value":"Active","label":"Active"},
                        {"value":"Not currently active","label":"Not currently active"},
                        {"value":"Gone but not forgotten","label":"Gone but not forgotten"}
                    ],
					"_inputex": {
						"label": "Status"
					}
				},
				"stylesPlayed":{
					description: "Styles played",
					"type":"array",
					"required":true,
					"items": {
						"type":"string"
					},
					"_inputex": {
						"label": "Different styles played:"
					}
				},
				"area":{
					description: "Area",
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Area/Region"
					}					
				},
				"yearFounded":{
					description: "Year founded",
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Year Founded"
					}					
				}
			}
		},

		app: {
			"description":"A band profile",
			"type":"object",
			"properties":{
				"bandName":{
					"type":"string",
					"required":true,
					"_inputex": {
						"label": "Band Name",
						"size":40
					}
				},
				"status":{
					"type":"string",
					"optional":true,
                    "choices": [
                        {"value":"Active","label":"Active"},
                        {"value":"Not currently active","label":"Not currently active"},
                        {"value":"Gone but not forgotten","label":"Gone but not forgotten"}
                    ],
					"_inputex": {
						"label": "Status"
					}
				},
				"website":{
					"type":"url",
					"optional":true,
					"_inputex": {
						"label": "Band website"
					}					
				},
				"_attachments":{
					"type":"file",
					"clickable":true,
					"enctype":"multipart/form-data",
					"optional":true,
					"_inputex": {
						"label": "Image"
					}
				},
				"stylesPlayed":{
					"type":"array",
					"required":true,
					"items": {
						"type":"string",
                        choices: [
                            { value: "Tejano", label: "Tejano" },
                            { value: "Rock & Roll", label: "Rock & Roll" },
                            { value: "Polka", label: "Polka" },
                            { value: "R&B-Soul", label: "R&B-Soul" },
                            { value: "Honky Tonk", label: "Honky Tonk" },
                            { value: "Western Swing", label: "Western Swing" },
                            { value: "Cajun-Zydeco", label: "Cajun-Zydeco" },
                            { value: "Rockabilly", label: "Rockabilly" },
                            { value: "Singer-Songwriter", label: "Singer-Songwriter" },
                            { value: "Blues", label: "Blues" },
                            { value: "Country", label: "Country" },
                            { value: "Other", label: "Other" }
                        ]
					},
					"_inputex": {
						"label": "Different styles played:"
					}
				},
				"area":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Area/Region"
					}					
				},
				"contactName":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Contact Name",
						"size": 40
					}					
				},
				"phone":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Phone"
					}					
				},
				"email":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "E-Mail",
						"size": 40
					}					
				},
				"yearFounded":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Year Founded"
					}					
				}				
			}
		},
		
		app_create: {
			"type":"object",
			"properties":{
				"bandName":{
					"type":"string",
					"required":true,
					"_inputex": {
						"label": "Band Name",
						"size":40
					}
				},
				"website":{
					"type":"url",
					"optional":true,
					"_inputex": {
						"label": "Band website"
					}					
				},
				"contactName":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Contact Name",
						"size": 40
					}					
				},
				"phone":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "Phone"
					}					
				},
				"email":{
					"type": "string",
					"optional": true,
					"_inputex": {
						"label": "E-Mail",
						"size": 40
					}					
				},
				"stylesPlayed":{
					"type":"array",
					"required":true,
					"items": {
						"type":"string",
                        choices: [
                            { value: "Tejano", label: "Tejano" },
                            { value: "Rock & Roll", label: "Rock & Roll" },
                            { value: "Polka", label: "Polka" },
                            { value: "R&B-Soul", label: "R&B-Soul" },
                            { value: "Honky Tonk", label: "Honky Tonk" },
                            { value: "Western Swing", label: "Western Swing" },
                            { value: "Cajun-Zydeco", label: "Cajun-Zydeco" },
                            { value: "Rockabilly", label: "Rockabilly" },
                            { value: "Singer-Songwriter", label: "Singer-Songwriter" },
                            { value: "Blues", label: "Blues" },
                            { value: "Country", label: "Country" },
                            { value: "Other", label: "Other" }
                        ]
					},
					"_inputex": {
						"label": "Different styles played:"
					}
				}
			}
		}
	}
};
};