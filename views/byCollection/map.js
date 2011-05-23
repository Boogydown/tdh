function(doc) {
  if (doc.type) {
    emit(doc, doc);
  }
};