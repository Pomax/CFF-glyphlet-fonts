define(["dataBuilding", "tables/name", "tables/OS_2"], function(dataBuilding, name, OS_2) {
  // do things here
  var nameTable = new name();
  nameTable.set(0, "no copyright");
  nameTable.set(1, "font name");
  nameTable.finalise()
  console.log(nameTable);

  var os2Table = new OS_2();
  os2Table.version = 3;
  console.log(os2Table);
});
