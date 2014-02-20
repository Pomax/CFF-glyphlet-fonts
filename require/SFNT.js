define(["dataBuilding", "tables/name"], function(dataBuilding, name) {
  // do things here
  var nameTable = new name();
  nameTable.set(0, "no copyright");
  nameTable.finalise()
  console.log(nameTable);
});
