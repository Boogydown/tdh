function(doc) {
  if (doc.type) {
    emit(new Date(doc.date).getTime(), doc);
  }
};