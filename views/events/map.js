function(doc) {
	// only events, happening today or later
	if (doc.type=="event" && new Date (doc.date) > new Date()) 
	{
		emit(doc._id, doc);
	}
};