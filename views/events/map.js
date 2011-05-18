function(doc) {
	// only events, happening today or later
	if (doc.type=="event") 
	{
		emit(doc, doc);
	}
};
