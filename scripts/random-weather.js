import { MODULE_NAMESPACE, WEATHER_NAMES_BY_VALUE } from "./constants.js";

export function applyRandomWeather() {
  const weatherOptions = ["surgeTime", "bronzeTime", "deadTime"];
  const randomWeather =
    weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
  game.settings.set(MODULE_NAMESPACE, "currentWeather", randomWeather);
  ui.notifications.info(
    `Weather has been randomized to ${WEATHER_NAMES_BY_VALUE[randomWeather]}.`
  );
}
