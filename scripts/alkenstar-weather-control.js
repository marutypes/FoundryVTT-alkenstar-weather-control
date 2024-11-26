import {
  MODULE_NAMESPACE,
  WEATHER_NAMES_BY_VALUE,
  WEATHER_IMAGES,
  WEATHER_VALUES_BY_NAME,
} from "./constants.js";
import { openWeatherSelector } from "./weather-selector.js";
import { getRandomSpell } from "./random-spell.js";
import { applyRandomWeather } from "./random-weather.js";

Hooks.once("ready", () => {
  game.alkenstarWeather = game.alkenstarWeather || {};
  game.alkenstarWeather.getRandomSpell = getRandomSpell;
  game.alkenstarWeather.applyRandomWeather = applyRandomWeather;
});

Hooks.once("init", () => {
  console.log("Alkenstar Weather Control |", "Initializing module");

  // Register the weather setting
  game.settings.register(MODULE_NAMESPACE, "currentWeather", {
    name: "Current Alkenstar Weather",
    hint: "Select the current Alkenstar weather condition.",
    scope: "world",
    config: true,
    default: "bronzeTime",
    type: String,
    choices: { ...WEATHER_NAMES_BY_VALUE },
    onChange: (value) => {
      console.log(
        "Alkenstar Weather Control |",
        `Weather changed to: ${value}`
      );

      const macroSettingName = `${value}Macro`;
      const macroName = game.settings.get(MODULE_NAMESPACE, macroSettingName);
      const macro = game.macros.getName(macroName);

      if (macro != null) {
        macro.execute();
      }

      // Notify players about the weather change
      ChatMessage.create({
        content: `<h2>The weather has changed to ${WEATHER_NAMES_BY_VALUE[value]}.</h2>
     <img id="alkenstar-weather-image" style="height:100px; width:100px; flex:initial; margin-top:0.5rem" src="${WEATHER_IMAGES[value]}" alt="${WEATHER_NAMES_BY_VALUE[value]}" style="width:100%; height:auto;"/>`,
      });

      // Apply weather effects based on the new weather
      applyWeatherEffects(value);
    },
  });

  // Register settings for status effects
  game.settings.register(MODULE_NAMESPACE, "surgeTimeEffectName", {
    name: "Surge Time Status Effect",
    hint: "Enter the name of the status effect to apply during Surge Time",
    scope: "world",
    config: true,
    type: String,
    default: "Effect: Surge Time",
  });

  game.settings.register(MODULE_NAMESPACE, "bronzeTimeEffectName", {
    name: "Bronze Time Status Effect",
    hint: "Enter the name of the status effect to apply during Bronze Time",
    scope: "world",
    config: true,
    type: String,
    default: "Effect: Bronze Time",
  });

  game.settings.register(MODULE_NAMESPACE, "deadTimeEffectName", {
    name: "Dead Time Status Effect",
    hint: "Enter the name of the status effect to apply during Dead Time",
    scope: "world",
    config: true,
    type: String,
    default: "Effect: Dead Time",
  });

  // Register setting for Surge Time rollable table
  game.settings.register(MODULE_NAMESPACE, "surgeTimeTableName", {
    name: "Surge Time Rollable Table",
    hint: "Enter the name of the rollable table to use during Surge Time",
    scope: "world",
    config: true,
    type: String,
    default: "Surge Time Effects",
  });

  game.settings.register(MODULE_NAMESPACE, "bronzeTimeMacro", {
    name: "Bronze Time Macro",
    hint: "The macro to run (if any) when switching to Bronze Time",
    scope: "world",
    config: true,
    type: String,
    default: "Bronze Time Macro",
  });

  game.settings.register(MODULE_NAMESPACE, "surgeTimeMacro", {
    name: "Surge Time Macro",
    hint: "The macro to run (if any) when switching to Surge Time",
    scope: "world",
    config: true,
    type: String,
    default: "Surge Time Macro",
  });

  game.settings.register(MODULE_NAMESPACE, "deadTimeMacro", {
    name: "Dead Time Macro",
    hint: "The macro to run (if any) when switching to Dead Time",
    scope: "world",
    config: true,
    type: String,
    default: "Dead Time Macro",
  });

  game.settings.register(MODULE_NAMESPACE, "noneMacro", {
    name: "No Weather Macro",
    hint: "The macro to run (if any) when switching to no weather",
    scope: "world",
    config: true,
    type: String,
    default: "No Weather Macro",
  });

  game.settings.register(MODULE_NAMESPACE, "applyEffectsToPlayers", {
    name: "Apply effects to players on change",
    hint: "Whether to apply the effects for different 'times' automatically for players",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_NAMESPACE, "applyEffectsToNPCs", {
    name: "Apply effects to NPCs on change",
    hint: "Whether to apply the effects for different 'times' automatically for npcs",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_NAMESPACE, "bronzeTimeFailure", {
    name: "Bronze time has a spell failure chance",
    hint: "Whether spells should have a flat check (2 or greater) to avoid fizzling during Bronze Time",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  
  console.log("Alkenstar Weather Control |", "Initialization complete!");

});

Hooks.on("createChatMessage", async (msg) => {
  const currentWeather = game.settings.get(MODULE_NAMESPACE, "currentWeather");

  // Check if the message is a spellcasting action
  const flags = msg.flags.pf2e || {};
  const origin = flags.origin || {};

  if (
    origin?.type === "spell" &&
    (msg.rolls == null || msg.rolls.length == 0)
  ) {
    const spellName = getSpellName(origin) || "Spell";

    const speaker = msg.speaker;

    if (currentWeather === "deadTime") {
      // Create a chat message saying the spell fizzled
      ChatMessage.create({
        content: `<strong>${spellName}</strong> fizzles due to Dead Time!`,
        speaker: speaker,
      });
    } else if (currentWeather === "bronzeTime") {
      const canFail = game.settings.get(MODULE_NAMESPACE, "bronzeTimeFailure");

      if (!canFail) {
        return;
      }

      // Create a chat message with a button that rolls a flat check for spell failure
      const chatContent = `
            <p><strong>${spellName}</strong> is cast during Bronze Time!</p>
            <button class="bronze-time-check">Roll Spell Failure Check</button>
          `;

      ChatMessage.create({
        content: chatContent,
        speaker: speaker,
      });
    } else if (currentWeather === "surgeTime") {
      // Create a chat message with a button to roll on the Surge Time table
      const chatContent = `
            <p><strong>${spellName}</strong> is cast during Surge Time!</p>
            <button class="surge-time-roll">Roll on Surge Time Table</button>
          `;

      ChatMessage.create({
        content: chatContent,
        speaker: speaker,
      });
    }
  }
});

// Handle button clicks in chat messages
Hooks.on("renderChatMessage", (message, html, data) => {
  html.on("click", ".bronze-time-check", async (event) => {
    event.preventDefault();

    // Roll a flat check (d20) to see if the spell fails
    let roll = await new Roll("1d20").roll({ async: true });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker(),
      flavor: "Bronze Time Spell Failure Check",
    });

    if (roll.total === 1) {
      // Spell fails
      ChatMessage.create({
        content: `<strong>The spell fails due to Bronze Time interference!</strong>`,
        speaker: ChatMessage.getSpeaker(),
      });
    } else {
      // Spell succeeds
      ChatMessage.create({
        content: `<strong>The spell succeeds!</strong>`,
        speaker: ChatMessage.getSpeaker(),
      });
    }
  });

  html.on("click", ".surge-time-roll", async (event) => {
    event.preventDefault();

    const tableName = game.settings
      .get(MODULE_NAMESPACE, "surgeTimeTableName")
      .trim();

    const table = await getTableByName(tableName);

    if (table == null) {
      ui.notifications.error(
        `Alkenstar Weather Control | Rollable Table "${tableName}" not found in world or compendium.`
      );
      return;
    }

    await table.draw();
  });
});

Hooks.on("getSceneControlButtons", (controls) => {
  // Find the Token Controls group
  const tokenControls = controls.find((control) => control.name === "token");

  if (tokenControls) {
    // Add a new tool to the Token Controls group
    tokenControls.tools.push({
      name: "alkenstar-weather-selector",
      title: "Select Alkenstar Weather",
      icon: "fas fa-cloud-sun-rain",
      visible: game.user.isGM,
      onClick: () => openWeatherSelector(),
      button: true,
    });
  }
});

async function applyWeatherEffects(weatherValue) {
  console.log(
    "Alkenstar Weather Control |",
    `Applying effects for ${weatherValue}`
  );

  await removeWeatherEffects();

  if (weatherValue == WEATHER_VALUES_BY_NAME.None) {
    // no effects for none
    return;
  }

  // Get the effect name from settings
  const effectSettingKey = `${weatherValue}EffectName`;

  const effectName = game.settings
    .get(MODULE_NAMESPACE, effectSettingKey)
    .trim();

  // Apply the effect if a name is provided
  if (effectName) {
    // Use the getEffectByName function to retrieve the effect
    const effectItem = await getEffectByName(effectName);

    if (effectItem) {
      // Apply the effect to appropriate actors
      for (let actor of game.actors) {
        const applyToPlayers = game.settings.get(
          MODULE_NAMESPACE,
          "applyEffectsToPlayers"
        );
        const applyToNPCs = game.settings.get(
          MODULE_NAMESPACE,
          "applyEffectsToNPCs"
        );
        const isPlayerCharacter = actor.type === "character";
        const isNpc = actor.type === "npc";
        if ((isPlayerCharacter && applyToPlayers) || (isNpc && applyToNPCs)) {
          // Create a copy of the effect data
          let effectData = duplicate(effectItem.toObject());

          // Assign a unique ID
          effectData._id = randomID();

          // Set flags to identify it as a weather effect
          effectData.flags = effectData.flags || {};
          effectData.flags[MODULE_NAMESPACE] = { isWeatherEffect: true };

          // Create the effect on the actor
          console.log(
            "Alkenstar Weather Control |",
            "Applying effect to:",
            actor.name
          );
          await actor.createEmbeddedDocuments("Item", [effectData]);
        }
      }
    } else {
      ui.notifications.error(
        `Alkenstar Weather Control | Effect "${effectName}" not found in world items or compendium.`
      );
    }
  }
}

async function getEffectByName(effectName) {
  console.log("Alkenstar Weather Control |", "FINDING EFFECT");
  // Try to get the effect from world items
  let effectItem = game.items.getName(effectName);

  if (effectItem != null) {
    return effectItem;
  }

  // Try to get the effect from the compendium
  const pack = game.packs.get(`${MODULE_NAMESPACE}.weather-effects`);
  if (pack != null) {
    // Get the effect from the compendium by name
    const index = await pack.getIndex();
    const entry = index.find((e) => e.name === effectName);
    if (entry) {
      effectItem = await pack.getDocument(entry._id);
      return effectItem;
    }
  }

  // If not found, return null
  return null;
}

async function getTableByName(tableName) {
  console.log("Alkenstar Weather Control |", "FINDING TABLE");
  // Try to get the table from world
  let table = game.tables.getName(tableName);

  if (table != null) {
    return table;
  }

  // Try to get the table from the compendium
  const pack = game.packs.get(`${MODULE_NAMESPACE}.weather-tables`);
  if (pack) {
    // Get the table from the compendium by name
    const index = await pack.getIndex();
    const entry = index.find((e) => e.name === tableName);
    if (entry) {
      table = await pack.getDocument(entry._id);
      return table;
    }
  }

  // If not found, return null
  return null;
}

async function removeWeatherEffects() {
  // Remove existing weather effects from all actors
  for (let actor of game.actors) {
    // Remove existing weather-related effects
    let effects = actor.items.filter((item) =>
      item.getFlag(MODULE_NAMESPACE, "isWeatherEffect")
    );
    for (let effect of effects) {
      await effect.delete();
    }
  }
}

function getSpellName(origin, defaultName) {
  const rollOptions = origin.rollOptions;

  if (rollOptions == null) {
    return defaultName;
  }

  if (origin.actor == null) {
    return defaultName;
  }

  const actorId = origin.actor.split(".")[1];
  const actor = game.actors.get(actorId);

  if (actor == null) {
    return defaultName;
  }

  const itemIdString = rollOptions.find((value) => {
    return value.startsWith("origin:item:id:");
  });

  if (itemIdString == null) {
    return defaultName;
  }

  const [itemId] = itemIdString.split(":").splice(-1);
  const item = actor.items.get(itemId);
  return item.name;
}
