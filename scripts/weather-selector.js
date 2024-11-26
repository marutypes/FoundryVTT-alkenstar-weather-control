import {
  MODULE_NAMESPACE,
  WEATHER_NAMES_BY_VALUE,
  WEATHER_IMAGES,
} from "./constants.js";

export function openWeatherSelector() {
  // Get the current weather
  const currentWeather = game.settings.get(MODULE_NAMESPACE, "currentWeather");

  // Create the dialog content
  const content = `
    <form>
      <div class="form-group">
        <label>Select Weather:</label>
        <select id="alkenstar-weather-selector" name="weather">
          ${Object.entries(WEATHER_NAMES_BY_VALUE)
            .map(
              ([value, label]) =>
                `<option value="${value}" ${
                  value === currentWeather ? "selected" : ""
                }>${label}</option>`
            )
            .join("")}
        </select>
        <img id="alkenstar-weather-image" style="height:50px; width:50px; flex:initial; margin-left:1rem" src="${
          WEATHER_IMAGES[currentWeather]
        }" alt="${
    WEATHER_NAMES_BY_VALUE[currentWeather]
  }" style="width:100%; height:auto;"/>
      </div>
    </form>
  `;

  // Create and render the dialog
  const d = new Dialog({
    title: "Alkenstar Weather Selector",
    content: content,
    buttons: {
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: "Apply",
        callback: (html) => {
          const selectedWeather = html
            .find("#alkenstar-weather-selector")
            .val();
          game.settings.set(
            MODULE_NAMESPACE,
            "currentWeather",
            selectedWeather
          );
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    default: "ok",
    render: (html) => {
      html.styles;
      // Add event listener to update the image when the weather changes
      html.find("#alkenstar-weather-selector").on("change", function (event) {
        const selectedWeather = event.target.value;
        const img = html.find("#alkenstar-weather-image");
        img.attr("src", WEATHER_IMAGES[selectedWeather]);
        img.attr("alt", WEATHER_NAMES_BY_VALUE[selectedWeather]);
      });
    },
  });
  d.render(true);
}
