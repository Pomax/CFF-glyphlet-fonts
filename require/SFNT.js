define(["dataBuilding", "tables"], function(dataBuilding, tables) {

  Object.keys(tables).forEach(function(key) {
    var constr = tables[key];
    var test = new constr();
  });

/*
  // do things here
  var nameTable = new tables.name();
  nameTable.set(0, "no copyright");
  nameTable.set(1, "font name");
  nameTable.finalise()
  console.log(nameTable);

  var os2Table = new tables.OS_2();
  os2Table.version = 3;
  console.log(os2Table);
*/
});
