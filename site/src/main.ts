import { createApp } from "vue";
import "primeicons/primeicons.css";
import "@kit/theme/tokens.css";
import "@kit/button.css";
import "@kit/theme/palettes.css";
import "@kit/theme/looks.css";
import "./site.css";
import App from "./App.vue";
import { applyAppearance, loadAppearance } from "./appearance";

// Paint in the saved palette, look and scheme before the first frame.
applyAppearance(loadAppearance());
createApp(App).mount("#app");
