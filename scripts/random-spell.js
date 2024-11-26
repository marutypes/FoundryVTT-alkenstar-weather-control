export async function getRandomSpell(rank) {
  const tableName = `Random Spell Rank ${rank}`;
  let table = game.tables.getName(tableName);

  if (!table) {
    // Try to find the table in the module's compendium pack
    const pack = game.packs.get("alkenstar-weather.random-spell-tables"); // Adjust the pack name accordingly
    if (pack) {
      // Load the index of the compendium
      await pack.getIndex();
      const entry = pack.index.find((e) => e.name === tableName);

      if (entry) {
        // Import the table into the world
        const tableDoc = await pack.getDocument(entry._id);
        const tableData = tableDoc.toObject();
        table = await RollTable.create(tableData);
        ui.notifications.info(`Imported table "${tableName}" from compendium.`);
      }
    }
  }

  if (!table) {
    ui.notifications.error(
      `Table "${tableName}" not found in world or compendium.`
    );
    return;
  }

  // Draw from the table
  await table.draw();
}
