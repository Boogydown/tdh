function(doc) {
  if (doc.type=="event") {
    emit(doc, doc);
  }
};