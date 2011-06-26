function(doc) {
  if (doc.type && (doc.type != "event" || (new Date(doc.date) > new Date())) ) {
    emit(doc.type, doc);
  }
};