function(new_doc, old_doc, userCtx) {

  // off for now
  return; 
  
  if(!userCtx.name) {
    // CouchDB sets userCtx.name only after a successful authentication
    throw({forbidden: "Please log in first."});
  }
}
