/**
 * The kit site: every piece, with where it lives and when to use it. The
 * site (`App.vue`) draws one entry per row here, with its demo from
 * `demos/<id>.vue`, and `coverage.test.ts` fails when a piece in `src/` is
 * neither listed here nor in `KIT_EXEMPT`.
 *
 * Reuse first: before writing a new piece, find the entry that fits. Make a
 * new one only when none does, and add it here with its demo. A piece that
 * does an existing entry's job with a different look is a prop on it.
 * `usedBy` says which apps import each piece today (information only).
 *
 * Every user-facing string is in this file so the page is easy to translate.
 */

export type KitGroup = "actions" | "inputs" | "choice" | "display" | "navigation" | "layout" | "feedback" | "overlays" | "pieces" | "brand";
/** Where a piece is built to run: the extension's manager and canvas, and the community site (which loads the same theme sheets as the manager). */
export type KitSurface = "manager" | "canvas" | "community";
/** An app that imports a piece (`@/kit/<file>`). */
export type KitApp = "extension" | "community";

export interface KitEntry {
  /** Stable id: the `data-kit-entry` on the kit page. */
  id: string;
  name: string;
  group: KitGroup;
  /** Repo path of the component, or of the stylesheet for a CSS-only piece. */
  file: string;
  /** Where it works. A canvas piece can't use the manager's stylesheet; every piece works on the community site. */
  surfaces: KitSurface[];
  /**
   * The apps that use it today (an app file outside its tests and kit demos
   * imports `@/kit/<file>`). Information, not a gate: a piece no app uses yet
   * may stay, and the site says so. Update it when an app starts or stops.
   */
  usedBy: KitApp[];
  /** When to reach for it. */
  use: string;
  /** What it replaces, so nobody builds that by hand again. */
  instead?: string;
}

/** How the site names the apps in "Used by". */
export const KIT_APP_LABEL: Record<KitApp, string> = { extension: "the extension", community: "the community site" };
export const KIT_USED_BY = "Used by";
export const KIT_UNUSED = "Not used by an app yet";
/** The header chip on a piece no app imports yet. */
export const KIT_UNUSED_CHIP = "Unused";

/** The API tables under each piece (`KitApi.vue`). */
export const KIT_API_TEXT = {
  label: "API",
  prop: "prop", props: "props", event: "event", events: "events", slot: "slot", slots: "slots", method: "exposed", methods: "exposed",
  propsTitle: "Props", eventsTitle: "Events", slotsTitle: "Slots", exposedTitle: "Exposed (ref.value…)",
  name: "Name", type: "Type", default: "Default", description: "Description", payload: "Payload", slotProps: "Slot props",
  required: "required", requiredTitle: "Must be passed",
} as const;

export const KIT_GROUPS: { id: KitGroup; label: string; blurb: string }[] = [
  { id: "actions", label: "Actions", blurb: "Things you press." },
  { id: "inputs", label: "Inputs", blurb: "Things you type into or pick from a list." },
  { id: "choice", label: "Choices", blurb: "On or off, one of a few, which tab." },
  { id: "display", label: "Display", blurb: "Showing a thing: cards, chips, icons, empty pages." },
  { id: "navigation", label: "Navigation", blurb: "Moving through steps and pages." },
  { id: "layout", label: "Layout", blurb: "Dividing, resizing and ordering space." },
  { id: "feedback", label: "Feedback", blurb: "Telling the user what happened or that something is busy." },
  { id: "overlays", label: "Dialogs and menus", blurb: "Anything that opens above the page." },
  { id: "pieces", label: "Bigger pieces", blurb: "Parts built from the kit that several screens share. Reuse them before writing another." },
  { id: "brand", label: "Brand", blurb: "The logo." },
];

export const KIT_ENTRIES: KitEntry[] = [
  // Actions
  {
    id: "button", name: "Button", group: "actions", file: "src/Button.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "Every button, in the manager, on the canvas (size sm) and on the community site. Primary for the one main action on a surface, secondary by default, ghost for quiet toolbar actions, danger for deletes, link for inline actions, add for the dashed \"Add a row\" button at the end of a list (with block for full width). Leave out the text for an icon button and give it an aria-label, which is also its tooltip; hint sets a tooltip on a labelled button and kbd adds its key chip. The close × is a ghost icon button: icon=\"times\" aria-label=\"Close\". as=\"a\" draws a link that looks like a button. pressed makes it a toggle. Sizes sm 24 / md 32 / lg 40; outline is a neutral bordered ghost; loading keeps its colours with the sparkle in the label colour; disabled fades.",
    instead: "WpButton and CloseButton (folded in: size=\"sm\" on the canvas; variant=\"ghost\" icon=\"times\" for close), a <button> with its own class and colours, or a hand-made × button.",
  },
  {
    id: "btn-css", name: "Button classes (.wp-btn)", group: "actions", file: "src/button.css", surfaces: ["manager", "community"], usedBy: ["extension", "community"],
    use: "The same look on a plain element where the Button component can't go, like a router-link that must stay an <a>. On the canvas use Button: the canvas never loads these classes globally.",
  },
  {
    id: "wp-icon-button", name: "WpIconButton", group: "actions", file: "src/WpIconButton.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "The 20 px icon button (24 px of click) inside a canvas row (module, injector, bundle and Model Info rows, the Context toolbar, and the Settings live preview of those rows): lock, internal, remove. tone tints the icon on hover and the whole box while pressed; pressed \"mixed\" is a bundle's \"some children\" state; variant bare is the row's fold caret. Rows are too tight for Button's 24 px sm.",
    instead: "A <button class=\"wp-btn--icon-sm\"> or a hand-made caret button.",
  },
  {
    id: "copy-button", name: "CopyButton", group: "actions", file: "src/CopyButton.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Copy text to the clipboard. The icon turns into a check (or a cross when the copy fails) and says so to screen readers, so no toast is needed. Works on plain-http pages too.",
    instead: "A button that calls navigator.clipboard and shows its own message.",
  },
  {
    id: "toolbar", name: "Toolbar", group: "actions", file: "src/Toolbar.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A row of buttons that is one Tab stop: the arrow keys move between them and Home/End jump to the ends. attached joins the buttons into one button group. Put a vertical Separator between groups of actions.",
    instead: "A flex row of buttons where Tab stops on every one, or joined buttons with their own corner rules.",
  },
  // Inputs
  {
    id: "input", name: "Input", group: "inputs", file: "src/Input.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "One-line text, on the 24/32/40 scale (size sm/md/lg); styles itself, so it works on the canvas too. Optional inline icon, a prefix like $ for variable names, a suffix like a unit, a readonly look (dashed, dimmer, lock), mono text for names and ids, and a tone: accent for a value changed from its default, warn for one that needs a look. Numbers use WpNumber, searches SearchInput.",
    instead: "A bare <input> with its own border and focus ring.",
  },
  {
    id: "textarea", name: "Textarea", group: "inputs", file: "src/Textarea.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "Several lines of plain text. Turn on autoResize when the box should grow with its text; mono and tone work as on Input. Prompt text with $variables uses RichTextInput instead.",
  },
  {
    id: "field", name: "Field", group: "inputs", file: "src/Field.vue", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "A label, a hint and an error around any control, so they line up the same everywhere.",
    instead: "A <label> and a <p class=\"hint\"> written per form.",
  },
  {
    id: "select", name: "Select", group: "inputs", file: "src/Select.vue", surfaces: ["manager", "community"], usedBy: ["extension", "community"],
    use: "Pick one value from a list in the manager. It filters as you type and can be cleared (the ✕ shows on hover or focus, set apart from the chevron). The list follows the field when the page scrolls.",
    instead: "A native <select>, which can't be themed in the dark.",
  },
  {
    id: "wp-select", name: "WpSelect", group: "inputs", file: "src/WpSelect.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A small dropdown for canvas widgets and dense rows, where the manager's Select is too big.",
  },
  {
    id: "wp-number", name: "WpNumber", group: "inputs", file: "src/WpNumber.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Every number field, canvas and manager. Our up and down arrows, keys and the wheel step it and clamp to min and max; typed values snap float fuzz. size sm (24, canvas default) / md (32, manager) / lg (40); suffix shows a unit; nullable when an empty box means \"use the default\".",
    instead: "<input type=\"number\"> with the browser's spinner, or Input type=\"number\" (removed).",
  },
  {
    id: "search-input", name: "SearchInput", group: "inputs", file: "src/SearchInput.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "Every search or filter box: magnifier, text, an optional \"3 of 12\" count or key hint, and a ✕ that clears it. Escape clears it first. size sm on the canvas and in tight rows.",
    instead: "PickerSearch, Input with a search icon, or a hand-made box with its own icon and clear button.",
  },
  {
    id: "list-filter", name: "ListFilter", group: "inputs", file: "src/ListFilter.vue", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "SearchInput for a long list inside an editor card: the count sits in the box, and it hides itself while the list is short.",
    instead: "Another search box with its own icon and count.",
  },
  {
    id: "slider", name: "Slider", group: "inputs", file: "src/Slider.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A number you set by feel along a range: a weight, a threshold, a brush size. Arrows step, PageUp/PageDown take ten steps, Home/End jump to the ends; marks label key values and format says the value in words; snap settles on the marks (snap alone: only mark values, arrows mark to mark; :snap=\"N\": pulled onto a mark within N, free elsewhere). with-input adds a WpNumber for the exact number. Give it a pair ([low, high]) for a range: two thumbs that can't cross, kept min-gap apart, a WpNumber at each side with with-input.",
    instead: "<input type=\"range\"> with the browser's track and thumb, or two Sliders for a range that can end up the wrong way round.",
  },
  {
    id: "tag-input", name: "TagInput", group: "inputs", file: "src/TagInput.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "A list of short words as chips: tags, accepts axes, #tags. Enter or a comma adds, Backspace in the empty box removes the last, pasting \"a, b, c\" adds three; suggestions open under the box and follow it. allow-new=false keeps it to the suggestions.",
    instead: "A text box split on commas, or chips plus a separate Add box.",
  },
  {
    id: "inline-edit", name: "InlineEdit", group: "inputs", file: "src/InlineEdit.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Rename in place: the name is a button, a click (or Enter or F2) makes it a text box, Enter or a click away saves and Escape puts the old name back. validate refuses a value with a message.",
    instead: "A pencil button that swaps in an <input> with its own Enter, Escape and blur handling.",
  },
  {
    id: "drop-zone", name: "DropZone", group: "inputs", file: "src/DropZone.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "Where files go: drag them in or Browse. It lights up for a file it takes and turns red with the reason for one it won't (type, size, one at a time). overlay wraps a panel (the chat) and shows only while a file is over it.",
    instead: "dragover and drop handlers on a div, with a hidden file input and its own highlight.",
  },
  {
    id: "color-field", name: "ColorField", group: "inputs", file: "src/ColorField.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "The one colour picker: a swatch with its hex that opens the colour square, a hex box and, with alpha, an opacity number; allow-none adds None, presets a row of preset swatches (true for the kit's twelve, or your own list) that take a colour in one click. size sm on the canvas, md in a manager form (a 20px swatch); compact shows the swatch alone, for a name row. Writes #rrggbb, #rrggbbaa once see-through, or none.",
    instead: "ColorPicker (merged in: presets), a text box for a hex code, or a native <input type=\"color\">, which has no opacity and looks different in every browser.",
  },
  {
    id: "hsv-picker", name: "HsvPicker", group: "inputs", file: "src/HsvPicker.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A full colour square and hue bar, for when presets are not enough.",
  },
  {
    id: "combobox", name: "Combobox", group: "inputs", file: "src/Combobox.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A select you can type in, for long lists: models, LoRAs, categories, variables. Typing filters, the arrows light an option, Enter takes it. multiple keeps the picks as chips and the list open, with a tick on each pick. Use WpSelect for a few fixed choices and TagInput when people may type their own words.",
    instead: "A search box over a hand-made list, or a native <select> nobody can type in.",
  },
  {
    id: "date-picker", name: "DatePicker", group: "inputs", file: "src/DatePicker.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "Pick a calendar day (a \"changed since\" filter, a history range). The value is a YYYY-MM-DD string; the month grid opens in a Popover. Arrows move a day or a week, PageUp/PageDown a month (Shift a year), Enter picks; min and max fence it.",
    instead: "<input type=\"date\">, which looks different in every browser and ignores the theme.",
  },
  // Choice
  {
    id: "checkbox", name: "Checkbox", group: "choice", file: "src/Checkbox.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "The one checkbox, on the canvas and in the manager: tick one item, or one row in a list. A label (prop or slot) toggles on click; without one the box alone is the piece, so give it an aria-label. size sm is the 14px box of a canvas row, md 16px (ComfyUI's own); either takes a 24px click around the box. indeterminate draws the mixed state for \"some selected\"; --check-on tints the checked fill (a bundle colour). Disabled turns grey with a dimmed label. field draws it as an input-height box for a yes/no filter beside dropdowns (Favorites only).",
    instead: "WpCheck (merged in: size=\"sm\", --check-on), the global .wp-check class on a hand-made span, or <input type=\"checkbox\"> drawn by the browser.",
  },
  {
    id: "wp-switch", name: "WpSwitch", group: "choice", file: "src/WpSwitch.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "On or off, taking effect at once, on the canvas or in the manager (one component, so one stylesheet). The track look is a sliding knob (sm is ComfyUI's own Nodes 2.0 switch: 36 x 20 track, 16 px knob); the chip look is a labelled chip that lights up, for a row of runtime switches (Hide from prompt, Lock pick). mixed draws a bulk switch where only some children are on.",
    instead: "Toggle (merged in: use size=\"md\" in the manager, invalid for the old error), or a button with role=\"switch\" and its own toggle--on class.",
  },
  {
    id: "toggle-row", name: "Toggle row (v-toggle-row)", group: "choice", file: "src/toggle-row.ts", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "Put it on a row that lays out its own words beside one Checkbox or WpSwitch (a label on the left, a switch on the right): a click on the words flips the toggle, like a label, and the row shows the hand. It stays out of the way when the row holds two toggles or another field, when the click lands on a button, link or the toggle itself, and while the toggle is disabled. SettingRow does this on every row. When the words can sit inside the toggle, pass them as its label instead.",
    instead: "Words beside a box that do nothing on click, or an @click on the label span that flips the model by hand.",
  },
  {
    id: "tabs", name: "Tabs", group: "choice", file: "src/WpTabs.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "Switch between views of the same thing. The arrow keys move between tabs, a long row scrolls, and an optional count follows each label. size=\"sm\" on the canvas.",
    instead: "A tab strip of buttons with role=\"tab\" and its own underline and key handling (the old .wp-tabs class).",
  },
  {
    id: "segmented", name: "Segmented control", group: "choice", file: "src/WpSegmented.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "Pick one of two to five short options that all stay visible (theme, mode, view). The arrow keys move the choice. icon-only for a row of icons with tooltips; an option's hint and kbd show in its tooltip (\"Grid\" with the key G).",
    instead: "A row of joined buttons with its own active colour, or a select with three options.",
  },
  {
    id: "radio-group", name: "RadioGroup", group: "choice", file: "src/RadioGroup.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "One of a few options that each need a line of explanation (prompt style, install mode). One Tab stop, the arrows move and choose; cards draws each option as a bordered card, and the label slot adds a badge after an option's name (the AI provider list). For two to five short words on one row use Segmented. variant=\"swatch\" draws each option as a round colour swatch named by its label (an accent or frame colour).",
    instead: "A column of native radio inputs (the old .wp-radio class) with their own labels and hint text.",
  },
  {
    id: "choice-cards", name: "ChoiceCards", group: "choice", file: "src/ChoiceCards.vue", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "Pick one of a handful of options that each need a picture (a colour theme, a look, a layout). Each card shows a preview slot, a name and a hint; compact puts three to a row and the hint in a tooltip. The arrow keys move the choice. For options a line of text explains, use RadioGroup.",
    instead: "A grid of hand-made buttons with role=\"radio\" and their own selected border.",
  },
  // Display
  {
    id: "card", name: "Card", group: "display", file: "src/Card.vue", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "A panel with an optional title row (the card's name, 14px semibold). Editors and settings are made of these.",
  },
  {
    id: "chip", name: "Chip", group: "display", file: "src/Chip.vue", surfaces: ["manager", "community"], usedBy: ["extension", "community"],
    use: "The one pill: a tag, a status, a count, a category, a module type, a post's rating, a filter you turn on and off. Tones carry meaning (success, warn, danger, info); color tints it for a category or kind (kindColour(type) gives a module type's) and icon puts an icon in front. dot adds a status dot, count a small number, removable a plain ✕ that keeps the height. as=\"button\" (or a link) makes it take you somewhere; pressed (true or false) makes it a filter toggle with aria-pressed, lit in the accent or its color when on. size: xs (default, in a line of text), sm (24px, a filter row), md (32px). variant=\"stat\" is a tile: the count big on top, the label under it, a top edge in color; with pressed it filters a list (a summary row of counts).",
    instead: "ChipToggle, KindChip, RatingBadge and CategoryChip (all merged into Chip), a <button class=\"wp-chip\"> with its own active state, a hand-made pill span, or a stat card button with a coloured top edge."
  },
  {
    id: "kbd", name: "Kbd", group: "display", file: "src/Kbd.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A keyboard shortcut in help text or a menu, drawn as keys. Write Mod for the main modifier: it shows ⌘ on a Mac and Ctrl elsewhere. Screen readers hear the whole chord once.",
    instead: "<kbd class=\"wp-kbd\"> written key by key, or a hard-coded ⌘.",
  },
  {
    id: "badge", name: "Badge", group: "display", file: "src/Badge.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A count bubble or a status dot. Wrapped around a button or icon it sits on the corner (3 problems); alone it sits in the line, with text for a status (● Running). A dot without text needs a label; pulse for something running.",
    instead: "A coloured span dot or a count pill drawn per screen.",
  },
  {
    id: "description-list", name: "DescriptionList", group: "display", file: "src/DescriptionList.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Label and value rows: an item's details, a trace step, model info. Labels line up in one column; stacked puts each label above its value in a narrow panel. mono for ids and seeds, copy adds a copy button, an empty value draws a dash.",
    instead: "A two-column grid or table of labels and values written per panel.",
  },
  {
    id: "code-block", name: "CodeBlock", group: "display", file: "src/CodeBlock.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Text that must stay as written (JSON, a prompt as sent, a log, a snippet): mono font, syntax colours, a copy button and a wrap switch, scrolling past max-height. language (JSON, TS, Vue/HTML, CSS, Shell) tags the head and picks the colours; syntax picks them without a tag (syntax=\"prompt\" colours $vars, @{refs}, {a|b} and weights). line-numbers for logs; bare drops the head.",
    instead: "A <pre> with its own copy button, or none.",
  },
  {
    id: "icon", name: "Icon", group: "display", file: "src/Icon.vue", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "Every icon. Use the ICON_SM, ICON_MD and ICON_LG sizes. Icons are decoration: the button or text next to them carries the meaning.",
    instead: "An inline <svg> pasted into a component.",
  },
  {
    id: "empty-state", name: "EmptyState", group: "display", file: "src/EmptyState.vue", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "A page or list with nothing in it yet: say what goes here and offer the one action that fills it. size page (an empty list page), panel (the default, in a card or panel) or inline (one row).",
  },
  {
    id: "image-zoom", name: "WpImageZoom", group: "display", file: "src/WpImageZoom.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Look at one picture closely: real zoom levels (Fit, 100%, 200%, − / +), scroll to zoom toward the pointer, drag to move, double-click for Fit or 100% at that spot, keys + − 0 1 2 when focused. v-model:zoom keeps the level (null = Fit), and the spot carries over when src changes, so a series is checked in one place. Slots bar-start / bar-end add buttons to its bar; `fullscreen` adds a Fullscreen button (key F) that fills the screen with the viewer, bar included, plus a #fullscreen slot along the bottom that shows only then. `minimap` adds a small copy in the corner once zoomed past the stage (its box is the part in view; click or drag it to move). `autohide` fades the bar, hint and mini-map after 2 s without a move or key. `second` shows another picture beside the first, locked to the same level and spot (synced compare); #first / #second put captions over each.",
    instead: "An <img> with max-width: 100% called a zoom, or a hand-made transform with its own wheel and drag code.",
  },
  {
    id: "disclosure", name: "Disclosure", group: "display", file: "src/Disclosure.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "A section that folds open under its heading (advanced options, details, a long list). The chevron turns and the body grows; boxed draws it as a card; flush makes the heading a full-width band with no body indent, for a section of a table that fills its card (a group of options, a rule). Controls that must not fold it (an on/off switch, a select-all box) go in #actions (right) or #lead (left), outside the heading button.",
    instead: "A button with its own aria-expanded, chevron and v-if.",
  },
  {
    id: "data-table", name: "DataTable", group: "display", file: "src/DataTable.vue", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "Rows and columns: sticky header, sort by a column, tick rows, loading and empty rows. Put custom cells in #cell-<key>. Rows that open something: row-clickable + active-key; add a #detail slot and the open row unfolds under itself (aria-expanded).",
    instead: "A <table class=\"wp-table\"> with its own sort state and select-all, or a div table whose rows are buttons that open a detail line.",
  },
  {
    id: "avatar", name: "Avatar", group: "display", file: "src/Avatar.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["community"],
    use: "A person or bot: community authors, chat participants, history entries. Shows the picture, or initials on a colour picked from the name when there is none or it fails to load. decorative when the name is written beside it.",
  },
  {
    id: "timeline", name: "Timeline", group: "display", file: "src/Timeline.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "Events in order on one line: history, an AI trace, a pack build log. Each has a title, a time, an optional body and a tone; the last can be pending (a pulsing dot). #body and #time slots take a diff, a code block or a RelativeDate.",
    instead: "A list with its own dots and connecting line.",
  },
  {
    id: "diff-view", name: "DiffView", group: "display", file: "src/DiffView.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "What changed between two texts, by words (an option, a template) or by lines (a pack, JSON). Removed is struck through on red, added is on green, and screen readers hear \"removed\"/\"added\". layout=\"split\" puts Before and After side by side.",
    instead: "Two text boxes next to each other, or colour alone marking the change.",
  },
  {
    id: "image-grid", name: "ImageGrid", group: "display", file: "src/ImageGrid.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "A grid of image tiles that fills its width: run outputs, frames, community previews. A click opens the Lightbox; selectable puts a check box on each tile with v-model:selected holding the ids. A tile without a src shimmers while it loads.",
    instead: "A flex wrap of <img> tags with its own zoom overlay.",
  },
  {
    id: "visually-hidden", name: "VisuallyHidden", group: "display", file: "src/VisuallyHidden.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Text only screen readers hear: a label for an icon-only area, a live status line. focusable shows it again when it gets focus (a \"Skip to\" link).",
    instead: "Another copy of the 1 px clip rule (.wp-sr-only, __sr spans).",
  },
  // Navigation
  {
    id: "stepper", name: "Stepper", group: "navigation", file: "src/Stepper.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "The 1 · 2 · 3 header of a job done in steps (pack builder, import, setup). Done steps show a check, a step with a problem a mark; clickable makes the steps buttons and linear stops jumping past the next one. vertical for a side rail.",
    instead: "A row of numbered circles and lines drawn per wizard.",
  },
  {
    id: "pagination", name: "Pagination", group: "navigation", file: "src/Pagination.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "Move through a long list a page at a time (first, last and the pages around the current one), or mode=\"more\" for a Load more button under \"Showing 50 of 230\". Draws nothing when everything fits on one page.",
    instead: "Prev / Next buttons and a page count written per list.",
  },
  // Layout
  {
    id: "separator", name: "Separator", group: "layout", file: "src/Separator.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "A thin line between groups, across or upright, with optional text in the middle (or). Decorative by default; decorative=false when it really divides the content.",
    instead: "An <hr>, a bordered div, or a menu divider styled per menu.",
  },
  {
    id: "resize-handle", name: "ResizeHandle", group: "layout", file: "src/ResizeHandle.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "The grip on a panel's edge that drags it wider or taller (the chat drawer, a column, a box). v-model is the size in px; the arrow keys move it, Home/End jump to min/max, Enter or a double click puts back the default. reverse for a left or top edge.",
    instead: "mousedown, mousemove and mouseup handlers on a hand-made edge, with no keyboard.",
  },
  {
    id: "split-pane", name: "SplitPane", group: "layout", file: "src/SplitPane.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "Two panels side by side, or one above the other, with a ResizeHandle between them. v-model is the first panel's size in px.",
    instead: "A grid with a dragged column width kept by hand.",
  },
  {
    id: "sortable-list", name: "SortableList", group: "layout", file: "src/SortableList.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Rows you put in order: drag the grip (a line shows where it lands, Escape cancels), or from the keyboard Space picks up, the arrows move, Space drops; Alt+↑/↓ moves one step. Each move is said to screen readers.",
    instead: "HTML drag and drop with its own handle, drop line and no keyboard.",
  },
  {
    id: "virtual-list", name: "VirtualList", group: "layout", file: "src/VirtualList.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "A long list of same-height rows (thousands of options, every library item): only the rows in view are built, so it scrolls smoothly. Rows keep their place for screen readers; scrollToIndex brings one into view.",
    instead: "Rendering every row, or a hand-made windowing loop.",
  },
  // Feedback
  {
    id: "progress", name: "ProgressBar", group: "feedback", file: "src/ProgressBar.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "How far a job is: give value and max for a bar that fills, leave value out while nobody knows and it sweeps. show-value puts the label and the percent above it. For a whole page that is loading use LoadingMark.",
    instead: "A div whose width is set by hand, or a counter in text.",
  },
  {
    id: "skeleton", name: "Skeleton", group: "feedback", file: "src/Skeleton.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "Grey shapes where content is about to land, so nothing jumps: shape row (icon circle, or square for an item icon), line, block (a card or a picture), circle, chip (a tag or filter row). label says Loading… to screen readers. A whole page or panel whose shape isn't known uses LoadingMark block instead.",
    instead: "The wp-skel classes from _skeleton.css, or a Loading… flash.",
  },
  {
    id: "toast", name: "Toast (manager)", group: "feedback", file: "src/useToast.ts", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "A short note after an action, with an optional Undo. Call useToast().push(); the app shows it.",
  },
  {
    id: "toast-card", name: "ToastCard", group: "feedback", file: "src/ToastCard.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "The one toast look both stacks draw (manager bottom right, canvas under the menu bar). You push to a store, never mount it yourself.",
    instead: "A toast styled per surface.",
  },
  {
    id: "banner", name: "Banner", group: "feedback", file: "src/Banner.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A message that stays on the page until it no longer applies: a draft to restore, a failed load, out-of-date items. Tone sets the colour and icon; add actions and a close button when they help.",
    instead: "A tinted <div> with its own icon, colours and Dismiss button.",
  },
  {
    id: "loading-mark", name: "LoadingMark", group: "feedback", file: "src/LoadingMark.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "Anything busy. Inline (a text row, a button, a list item) it draws the AI sparkle; a block (a page or panel that is loading) draws the full logo animation. Give it a label, or slot text for a \"Loading bundle…\" row; mono draws it in the text colour, brand=\"community\" in the community site's colours. The motion is drawn on a canvas, so it stays sharp and glides in every browser; with reduced motion the still mark only breathes. Hosts can slow or pause it with data-wp-motion-speed / data-wp-motion-paused on an ancestor.",
    instead: "A spinner or plain \"Loading…\" text.",
  },
  {
    id: "working-line", name: "WorkingLine", group: "feedback", file: "src/WorkingLine.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "The \"model is working\" line, like Claude Code's: a mark drawn from the logo's sparkles (variant typing, shuffle, orbit or burst), a word that crossfades when it changes, and the time so far. It only draws; the app picks the word, time and tempo (slow while the model reads, mid while it thinks, fast while it writes). wordKey keeps a token count ticking up from crossfading every time. inline makes it smaller for a top bar.",
    instead: "LoadingMark plus a status text when an AI request is running.",
  },
  {
    id: "motion-css", name: "Entrance classes (motion.css)", group: "feedback", file: "src/motion.css", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Classes for things that appear while you watch: wp-enter-fade (each new run of streamed text), wp-enter-pop (a reaction), wp-enter-rise (a chip by a selection; data-from=\"below\" when it sits under it), wp-enter-drop (a panel that asks for something) and wp-attention (a ring that pulses three times). Set --wp-enter-x when the element shifts itself sideways (a chip centred with -50%). They animate registered properties, so text stays sharp while it moves.",
    instead: "A keyframe of opacity or transform in each component.",
  },
  // Overlays
  {
    id: "modal", name: "Modal", group: "overlays", file: "src/Modal.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "The one dialog, in the manager, on the canvas and on the community site: a title, body and footer buttons on ModalShell, so keys pressed in it never reach ComfyUI's shortcuts. Escape, the × and the backdrop close it (close-on-backdrop=\"false\" for a form that would lose work); Tab stays inside and focus goes back on close. size sm / md / lg; a custom #header puts :id=\"titleId\" on its heading; keydown gives every key pressed inside.",
    instead: "A div with role=\"dialog\" and its own backdrop, or ModalShell plus a hand-made frame.",
  },
  {
    id: "drawer", name: "Drawer", group: "overlays", file: "src/Drawer.vue", surfaces: ["manager", "community"], usedBy: ["extension", "community"],
    use: "A panel that slides in from the side: an inspector, history, settings beside the work. Escape closes it and focus goes back. Turn modal off to keep the page usable behind it.",
    instead: "Another fixed side panel with its own width, header and close button.",
  },
  {
    id: "popover", name: "Popover", group: "overlays", file: "src/Popover.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A panel anchored to a button: a colour picker, a filter, a small form. It flips to stay on screen, follows on scroll and closes on Escape or a click outside. Every floating panel builds on it. One panel shared by many triggers (the cells of a rule grid) passes the clicked element as anchor instead of a trigger slot. A list that follows the text caret, or a card opened at a point, passes a virtual anchor (rectAnchor in floating.ts). Attributes go on the panel, so a hover card can stay open while the pointer is on it.",
    instead: "A Teleport with its own placement maths and outside-click handler, including caret-following autocomplete lists and hover cards.",
  },
  {
    id: "dropdown-menu", name: "DropdownMenu", group: "overlays", file: "src/DropdownMenu.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["community"],
    use: "A list of actions behind a button (the ⋯ menu, More, Add…). Arrows, Home/End and Enter work. Takes the same items as ContextMenu, so a row's right-click and ⋯ menus can share one list. An item with checked is a checkbox item (a tick when on); keepOpen leaves the menu open so several can be ticked in a row.",
    instead: "A hand-built menu of buttons under a ⋯ button.",
  },
  {
    id: "tooltip", name: "Tooltip (v-tooltip)", group: "overlays", file: "src/tooltip.ts", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "A short hint on hover and on keyboard focus. One attribute: v-tooltip=\"'Copy the prompt'\", or an object with a shortcut (kbd: 'Ctrl C'). Icon-only buttons still need an aria-label; the tooltip is for sighted mouse and keyboard users.",
    instead: "title=\"…\", which is slow, can't be styled, never shows from the keyboard and is cut off on the canvas.",
  },
  {
    id: "modal-shell", name: "ModalShell", group: "overlays", file: "src/ModalShell.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "The backdrop, open/close motion, Escape and the key shield (keys pressed in a dialog never reach ComfyUI's shortcuts) under every dialog. Modal is built on it; reach for it alone only for a dialog with its own frame (a full-screen picker). close says why: escape or backdrop.",
  },
  {
    id: "confirm-modal", name: "ConfirmModal", group: "overlays", file: "src/ConfirmModal.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "Ask before something that can't be undone, in the manager, on the canvas or on the community site. Built on Modal, so Escape, Tab and focus return work like every other dialog. Name the action on the confirm button (Delete, not OK); tone=\"danger\" for deletes and discards, tone=\"warn\" for something that matters but can be undone. requireType makes the user type a word first (deleting an account); confirmDisabled holds Confirm off while a field in the slot is empty.",
    instead: "ConfirmDialog (folded in: visible → open, variant=\"danger\" → tone=\"danger\"), or window.confirm().",
  },
  {
    id: "context-menu", name: "ContextMenu", group: "overlays", file: "src/ContextMenu.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "A right-click menu at the pointer: sections, icons, dividers, a danger item. It stays on screen near the edges. For a menu behind a button use DropdownMenu.",
    instead: "Another absolutely positioned list of buttons.",
  },
  {
    id: "lightbox", name: "Lightbox", group: "overlays", file: "src/Lightbox.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "One image full screen over a dimmed page: arrows or the side buttons step through the rest, Escape or the close button shuts it and focus goes back. Built on ModalShell, so keys inside never reach ComfyUI. zoom shows each picture in WpImageZoom, keeping the level and the spot as you step. ImageGrid opens it for you.",
    instead: "A fixed-position <img> with its own Escape listener (DocImage's zoom).",
  },
  // Bigger pieces
  {
    id: "selection-bar", name: "SelectionBar", group: "pieces", file: "src/SelectionBar.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "The bar over a list while rows are ticked: \"3 selected\", the bulk actions and Clear. #start goes after the count (an option, a reason box), the default slot holds the actions; sticky keeps it at the top while the list scrolls (--wp-selection-bar-top for a fixed header). Escape inside it clears.",
    instead: "A hand-made bulk bar per list (.wpc-bulk-bar, .wpc-seltoolbar, .wpc-deltoolbar) with its own count and colours.",
  },
  {
    id: "setting-group", name: "SettingGroup", group: "pieces", file: "src/SettingGroup.vue", surfaces: ["manager", "community"], usedBy: [],
    use: "A settings page: SettingGroup is a titled panel, each SettingRow a label and hint on the left and its control on the right, split by hairlines. setting-key gives a row an id for a search to jump to and highlighted flashes it; stacked puts a wide control under the text; form lines rows up as a label column; recommended names the usual pick. A click on a row's words flips its one checkbox or switch (v-toggle-row). A narrow group puts every row in one column.",
    instead: "A hand-made settings row (.wpc-settings-row) with its own name, hint and control layout.",
  },
  {
    id: "setting-row", name: "SettingRow", group: "pieces", file: "src/SettingRow.vue", surfaces: ["manager", "community"], usedBy: [],
    use: "One row of a SettingGroup: label, hint and the control. form lines rows up as a label column and a control column (a small form in a panel); stacked puts a wide control under the text; #badge goes after the label and #extra under the hint.",
  },
  {
    id: "relative-date", name: "RelativeDate", group: "pieces", file: "src/RelativeDate.vue", surfaces: ["manager", "community"], usedBy: ["extension"],
    use: "\"5 min ago\" for a timestamp, with the full date on hover.",
  },
  {
    id: "icon-picker", name: "IconPicker", group: "pieces", file: "src/IconPicker.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension"],
    use: "Pick an icon: from the curated set for a category or bundle, or with all from every PrimeIcons glyph with a search box (a note's icon). The closed picker names the icon (or says Choose icon); compact drops the name for a table cell; color tints the glyphs; inline draws the list itself, no trigger, for a panel in an editor; allow-none=false drops No icon. The list opens in a kit Popover.",
    instead: "NoteIconGrid and other hand-made icon grids with their own search box.",
  },
  {
    id: "support-links", name: "SupportLinks", group: "pieces", file: "src/SupportLinks.vue", surfaces: ["manager", "community"], usedBy: ["extension", "community"],
    use: "The ways-to-donate cards on an About page: icon, label, a line of detail, and a mark saying it opens outside. The app passes its own list of links.",
    instead: "A hand-made list of donate links styled per app.",
  },
  // Brand
  {
    id: "logo", name: "Logo", group: "brand", file: "src/Logo.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["extension", "community"],
    use: "The Wildcard Pipeline mark. Draw it at 16, 20, 28 or 40 px. brand=\"community\" draws the community site's rust counterpart.",
  },
  // Community pieces: what the community site shows for a post. Kept here so
  // the extension's Community tab and any later screen draw them the same way.
  {
    id: "drag-handle", name: "DragHandle", group: "layout", file: "src/DragHandle.vue", surfaces: ["manager", "canvas", "community"], usedBy: [],
    use: "The six-dot grip on a row you drag to reorder when the row owns the drag (HTML drag-and-drop on a module row, a bundle child). It only shows where to grab and is hidden from screen readers; give keyboard users their own way to move the row. For a list the kit reorders itself, with keyboard moves, use SortableList.",
    instead: "An inline six-circle <svg> in each row.",
  },
  {
    id: "list-row", name: "ListRow", group: "navigation", file: "src/ListRow.vue", surfaces: ["manager", "canvas", "community"], usedBy: ["community"],
    use: "One row of a list you click through: a facet with its count, a child in a bundle's list, a category in a tree, a dependency that opens its page. The whole row is the target. selected marks it (aria-current, or aria-pressed with toggle for a filter), muted dims a row that stays clickable, depth indents a simple tree, arrow says it opens a page, and #start takes anything before the label (a kind Chip). ArrowUp/ArrowDown move between rows inside the nearest data-wp-rows. For a pill filter use Chip with pressed; for a heading that folds a section, Disclosure.",
    instead: "A <button> styled as a row, with its own hover, active bar and count.",
  },
  {
    id: "bundle-meta", name: "BundleMeta", group: "display", file: "src/BundleMeta.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "One line under a bundle's name: how many modules it holds and their names.",
  },
  {
    id: "tokenized-value", name: "TokenizedValue", group: "display", file: "src/TokenizedValue.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "A wildcard-grammar string, read-only, with $var chips (green, red for .neg), @{ref} chips (magenta, red when unresolved, with the filter on hover) and the {a|b} / {N$$…} scaffolding dimmed. Pass uuidToName to show ref names. Built on rich-tokenize.ts, the extension's lexer.",
    instead: "Printing the raw string, or v-html from a hand-made highlighter.",
  },
  {
    id: "constraint-matrix-preview", name: "ConstraintMatrixPreview", group: "pieces", file: "src/ConstraintMatrixPreview.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "A constraint's source × target matrix, read-only: boost, reduce, exclude and only cells, axis bands from the tag groups, the reach selector and the exception rows. The editor's matrix is the extension's ConstraintMatrix; this is its viewer.",
  },
  {
    id: "post-card", name: "PostCard", group: "pieces", file: "src/PostCard.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "A community post in a grid: type stripe and chip, badges, version, slug, bundle contents, a few sample values (`samples`), description, tags, stars, downloads and when it changed. The whole card is a link; pass the app's router link as `as`.",
  },
  {
    id: "star-button", name: "StarButton", group: "pieces", file: "src/StarButton.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "Star a post: a toggle button with the count. The app sends the request and passes the new state back.",
  },
  {
    id: "bookmark-button", name: "BookmarkButton", group: "pieces", file: "src/BookmarkButton.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "Bookmark a post: a toggle button. The app sends the request and passes the new state back.",
  },
  {
    id: "payload-preview", name: "PayloadPreview", group: "pieces", file: "src/PayloadPreview.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "A published module or bundle payload, read-only, with Preview / Raw JSON tabs. It picks the view for the type: a wildcard's options with chance, tags, negatives, facets and grouping by axis; fixed values and a combine's template with where each input is used; a derivation's IF / ELSE IF / ELSE rules with AND / OR groups and numbered actions; a constraint's matrix (ConstraintMatrixPreview) or, when big, a searchable rules list; a bundle's children beside the picked child's own preview. Every value goes through TokenizedValue. Pass refNames (module id to name) and refGroups (module id to tag_groups) from the post's dependencies so refs and constraint axes read as names; tabs=false when the page draws its own.",
    instead: "Printing the payload JSON, or a per-type preview written for one page.",
  },
  {
    id: "rich-text", name: "RichText", group: "display", file: "src/RichText.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "Plain prose someone typed (a post description, a note): links open in a new tab and $var / @{ref} mentions become code chips, inline in your own paragraph. Built on linkify.ts, no v-html. A wildcard value is TokenizedValue, not this.",
    instead: "v-html from a linkifier, or printing URLs as dead text.",
  },
  {
    id: "post-grid-skeleton", name: "PostGridSkeleton", group: "pieces", file: "src/PostGridSkeleton.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "A grid of PostCards while its first page loads: card-sized blocks of mixed heights in the same masonry columns. count sets how many; label is read once to screen readers (\"\" inside another skeleton).",
    instead: "A spinner over an empty grid, or Skeleton blocks laid out per page.",
  },
  {
    id: "post-detail-skeleton", name: "PostDetailSkeleton", group: "pieces", file: "src/PostDetailSkeleton.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "A post page while it loads: meta line, title, description, tags and the preview card, with the download rail beside it (under it on narrow screens).",
  },
  {
    id: "profile-skeleton", name: "ProfileSkeleton", group: "pieces", file: "src/ProfileSkeleton.vue", surfaces: ["manager", "community"], usedBy: ["community"],
    use: "A public profile while it loads: the head card with the avatar and name, the three stat cards when stats is set, then a short post grid.",
  },
];



/**
 * How to use each entry, shown under its demo. Code, so not translated.
 */
/** Pieces in src/ that are not building blocks of their own. */
export const KIT_EXEMPT: Record<string, string> = {
  "src/ToastHost.vue": "Mounted once by the app; use useToast().",
  "src/WildcardPreview.vue": "Drawn by PayloadPreview for a wildcard payload; use PayloadPreview.",
  "src/FixedValuesPreview.vue": "Drawn by PayloadPreview for a fixed values payload; use PayloadPreview.",
  "src/CombinePreview.vue": "Drawn by PayloadPreview for a combine payload; use PayloadPreview.",
  "src/DerivationPreview.vue": "Drawn by PayloadPreview for a derivation payload; use PayloadPreview.",
  "src/DerivationCondition.vue": "One condition (or AND / OR group) inside DerivationPreview.",
  "src/ConstraintPreview.vue": "Drawn by PayloadPreview for a constraint payload; use PayloadPreview.",
  "src/BundlePreview.vue": "Drawn by PayloadPreview for a bundle payload; use PayloadPreview.",
  "src/PreviewGroup.vue": "A folding group inside WildcardPreview's tables.",
  "src/IconPickerPanel.vue": "IconPicker's list; use IconPicker (inline for the list alone).",
};

export const KIT_EXAMPLES: Record<string, string> = {
  "drag-handle": `<DragHandle />`,
  "list-row": `<ListRow :selected="tag === t" toggle icon="tag" :count="12" @click="pick(t)">portrait</ListRow>`,
  "bundle-meta": `<BundleMeta :count="3" :names="['palette', 'mood', 'style']" />`,
  "tokenized-value": `<TokenizedValue value="a {calm|fierce} $mood @{1a2b3c4d}" :uuid-to-name="names" />`,
  "constraint-matrix-preview": `<ConstraintMatrixPreview :rows :cols :matrix :source-groups :target-groups :exceptions source-name="species" target-name="temperament" target-select="next 2" :ref-map="names" />`,
  "post-card": `<PostCard :as="RouterLink" :to="\`/p/\${post.slug}\`" :post="card" />`,
  "star-button": `<StarButton :starred="starred" :count="12" @toggle="star" />`,
  "bookmark-button": `<BookmarkButton :bookmarked="saved" @toggle="bookmark" />`,
  "payload-preview": `<PayloadPreview :payload="version.payload" :ref-names="names" :ref-groups="groups" />`,
  "rich-text": `<p class="description"><RichText :text="post.description" /></p>`,
  "post-grid-skeleton": `<PostGridSkeleton v-if="loading" :count="6" />`,
  "post-detail-skeleton": `<PostDetailSkeleton v-if="loading" />`,
  "profile-skeleton": `<ProfileSkeleton v-if="loading" stats />`,
  "button": `<Button variant="primary" icon="plus" @click="add">New module</Button>\n<Button variant="ghost" icon="times" aria-label="Close" kbd="Esc" @click="close" />\n<Button size="sm" variant="add" icon="plus" block>Add rule</Button>`,
  "btn-css": `<button class="wp-btn wp-btn--primary wp-btn--sm">Run</button>`,
  "input": `<Input v-model="name" prefix="$" aria-label="Variable name" />`,
  "textarea": `<Textarea v-model="notes" :rows="3" auto-resize />`,
  "field": `<Field label="Name" hint="Shown in the library." for="name"><Input id="name" v-model="name" /></Field>`,
  "select": `<Select v-model="category" :options="options" clearable />`,
  "wp-select": `<WpSelect v-model="mode" :options="[{ value: 'hash', label: 'Hash' }]" aria-label="Strategy" />`,
  "wp-number": `<WpNumber v-model="count" :min="1" :max="64" aria-label="Count" />`,
  "search-input": `<SearchInput v-model="query" placeholder="Search modules" :visible="shown.length" :total="rows.length" />`,
  "list-filter": `<ListFilter v-model="query" :total="rows.length" :visible="shown.length" noun="rules" test-prefix="rules" />`,
  "color-field": `<ColorField v-model="band" alpha allow-none size="sm" aria-label="Label band" />  <ColorField v-model="color" presets size="md" aria-label="Category colour" />`,
  "hsv-picker": `<HsvPicker v-model="color" aria-label="Colour" />`,
  "checkbox": `<Checkbox v-model="picked" label="Include in bundle" />  <Checkbox v-model="on" size="sm" aria-label="Enabled" />`,
  "wp-switch": `<WpSwitch v-model="held" variant="chip" icon="pi-link" label="Hold across run" />`,
  "tabs": `<WpTabs v-model="tab" :tabs="[{ id: 'options', label: 'Options', count: 12 }, { id: 'rules', label: 'Rules' }]" aria-label="Editor sections" />`,
  "image-zoom": `<WpImageZoom v-model:zoom="zoom" :src="url" alt="Frame 3" hint="Drag to move · scroll to zoom" minimap autohide />`,
  "segmented": `<WpSegmented v-model="theme" :options="[{ value: 'dark', label: 'Dark', icon: 'pi-moon' }, { value: 'light', label: 'Light', icon: 'pi-sun' }]" aria-label="Theme" />`,
  "disclosure": `<Disclosure v-model:open="open" label="Advanced" :count="3">…</Disclosure>`,
  "data-table": `<DataTable v-model:sort="sort" v-model:selected="picked" :columns="columns" :rows="rows" row-key="id" selectable aria-label="Tags" />`,
  "banner": `<Banner tone="warn" title="2 modules are out of date" dismissible @dismiss="hide">Update them before you publish.</Banner>`,
  "copy-button": `<CopyButton :text="prompt" label="Copy prompt" />`,
  "wp-icon-button": `<WpIconButton icon="pi-lock" tone="warn" :pressed="locked" label="Lock seed" @click="toggle" />`,
  "card": `<Card title="Options" subtitle="12 options">…</Card>`,
  "chip": `<Chip tone="warn" icon="pi-exclamation-triangle">2 conflicts</Chip>  <Chip :color="cat.color" :icon="cat.icon">{{ cat.name }}</Chip>  <Chip variant="stat" :color="c" :count="24" :pressed="on" @click="flip">Subjects</Chip>`,
  "kbd": `<Kbd keys="Mod+K" />`,
  "icon": `<Icon name="pi-bolt" :size="ICON_MD" />`,
  "support-links": `<SupportLinks :links="SUPPORT_LINKS" />`,
  "empty-state": `<EmptyState icon="pi-inbox" headline="No bundles yet" body="…"><template #cta>…</template></EmptyState>`,
  "toast": `useToast().push({ severity: "success", summary: "Saved", action: { label: "Undo", run: undo } })`,
  "toast-card": `<ToastCard tone="success" summary="Saved Hair colour" action-label="Undo" @action="undo" @dismiss="close" />`,
  "loading-mark": `<LoadingMark block>Loading bundle…</LoadingMark>`,
  "working-line": `<WorkingLine :word="word" :word-key="phase" :time="elapsed" tempo="mid" variant="orbit" />`,
  "motion-css": `import "@dumiflex/wp-kit/motion.css";\n<span class="wp-enter-pop">👍</span>\n<div class="wp-enter-drop wp-attention">Search the web?</div>`,
  "modal": `<Modal v-model:open="open" title="Rename"><template #footer>…</template></Modal>`,
  "modal-shell": `<ModalShell :visible="open" @close="open = false"><div class="my-dialog">…</div></ModalShell>`,
  "confirm-modal": `<ConfirmModal :open="ask" title="Delete Hair colour?" confirm-label="Delete" tone="danger" @confirm="del" @cancel="ask = false" />`,
  "context-menu": `<ContextMenu :visible="open" :x="ev.clientX" :y="ev.clientY" :items="items" @close="open = false" />`,
  "drawer": `<Drawer v-model:open="open" title="History" width="380px">…<template #footer>…</template></Drawer>`,
  "popover": `<Popover v-model:open="open" label="Colour"><template #trigger="{ props }"><Button v-bind="props">Colour</Button></template>…</Popover>`,
  "dropdown-menu": `<DropdownMenu :items="actions" label="Hair colour actions"><template #trigger="{ props }"><Button v-bind="props" variant="ghost" icon="pi-ellipsis-h" /></template></DropdownMenu>`,
  "tooltip": `<Button v-tooltip="{ text: 'Copy to clipboard', kbd: 'Ctrl C' }" variant="ghost" icon="pi-copy" aria-label="Copy" />`,
  "logo": `<Logo :size="28" />`,
  "relative-date": `<RelativeDate :value="row.updated_at" />`,
  "toolbar": `<Toolbar label="Text tools" attached><Button size="sm" icon="bold" aria-label="Bold" /><Button size="sm" icon="italic" aria-label="Italic" /></Toolbar>`,
  "slider": `<Slider v-model="weight" :min="0" :max="2" :step="0.05" aria-label="Weight" with-input />\n<Slider v-model="range" :min="0" :max="200" :min-gap="20" aria-label="Token budget" show-value />\n<Slider v-model="width" :min="512" :max="1536" :marks="widths" snap aria-label="Width" />\n<Slider v-model="cfg" :min="1" :max="15" :step="0.5" :marks="presets" :snap="1" aria-label="CFG" />`,
  "tag-input": `<TagInput v-model="tags" :suggestions="libraryTags" aria-label="Tags" />`,
  "inline-edit": `<InlineEdit v-model="mod.name" label="Wildcard name" :validate="(v) => taken(v) ? 'That name is taken' : null" />`,
  "drop-zone": `<DropZone accept=".txt,.yaml,.yml,.zip" multiple hint="Wildcard files or a zip" @files="load" @reject="explain" />`,
  "badge": `<Badge :count="3" tone="danger" label="3 problems"><Button variant="ghost" icon="pi-bell" aria-label="Problems" /></Badge>  <Badge dot tone="success" text="Running" pulse />`,
  "selection-bar": `<SelectionBar v-if="picked.size" :count="picked.size" noun="options" sticky @clear="picked.clear()"><Button size="sm" variant="danger" icon="trash" @click="del">Delete</Button></SelectionBar>`,
  "setting-group": `<SettingGroup title="Content"><SettingRow label="Include NSFW posts" hint="Off by default." for="nsfw"><WpSwitch id="nsfw" v-model="nsfw" size="md" /></SettingRow></SettingGroup>`,
  "toggle-row": `<div v-toggle-row class="row"><span>Override base seed</span><WpSwitch v-model="on" aria-label="Override base seed" /></div>`,
  "setting-row": `<SettingRow label="Name" form for="name" hint="Shown in the library."><Input id="name" v-model="name" /></SettingRow>`,
  "description-list": `<DescriptionList :items="[{ label: 'Family', value: 'SDXL' }, { label: 'ID', value: id, mono: true, copy: true }]" />`,
  "code-block": `<CodeBlock :code="json" language="JSON" max-height="240px" />
<CodeBlock :code="template" title="Template" syntax="prompt" />`,
  "stepper": `<Stepper v-model="step" :steps="[{ id: 'describe', label: 'Describe' }, { id: 'plan', label: 'Plan' }, { id: 'build', label: 'Build' }]" clickable linear />`,
  "pagination": `<Pagination v-model:page="page" :total="rows.length" :page-size="50" />`,
  "separator": `<Separator label="or" />`,
  "resize-handle": `<ResizeHandle v-model="width" axis="x" reverse :min="280" :max="720" :default-size="380" label="Chat width" />`,
  "split-pane": `<SplitPane v-model="listWidth" :min="200" :max="520" label="List width"><template #start>…</template><template #end>…</template></SplitPane>`,
  "sortable-list": `<SortableList v-model="rules" :item-key="(r) => r.id" :item-label="(r) => r.name" label="Rules"><template #item="{ item }">{{ item.name }}</template></SortableList>`,
  "progress": `<ProgressBar :value="done" :max="total" label="Testing seeds" show-value />`,
  "skeleton": `<Skeleton shape="row" :lines="4" label="Loading modules" />`,
  "icon-picker": `<IconPicker v-model="icon" aria-label="Category icon" />\n<IconPicker v-model="note.icon" all :color="note.color" aria-label="Note icon" />\n<IconPicker :model-value="null" all inline :allow-none="false" @update:model-value="insertIcon" />`,
  "combobox": `<Combobox v-model="cats" multiple :options="categories" aria-label="Categories" />`,
  "date-picker": `<DatePicker v-model="since" :max="today" clearable aria-label="Changed since" />`,
  "choice-cards": `<ChoiceCards v-model="look" :options="LOOKS" aria-label="Look"><template #preview="{ option }"><LookDrawing :id="option.value" /></template></ChoiceCards>`,
  "radio-group": `<RadioGroup v-model="style" :options="[{ value: 'tags', label: 'Tags', hint: 'Comma separated' }]" aria-label="Prompt style" />`,
  "avatar": `<Avatar :name="post.author" :src="post.avatar_url" size="sm" />`,
  "timeline": `<Timeline :items="history"><template #time="{ item }"><RelativeDate :value="item.at" /></template></Timeline>`,
  "diff-view": `<DiffView :before="old.text" :after="draft.text" />`,
  "image-grid": `<ImageGrid v-model:selected="keep" :images="outputs" selectable />`,
  "visually-hidden": `<VisuallyHidden aria-live="polite">{{ status }}</VisuallyHidden>`,
  "virtual-list": `<VirtualList :items="options" :item-height="32" :item-key="(o) => o.id" label="Options"><template #item="{ item }">{{ item.text }}</template></VirtualList>`,
  "lightbox": `<Lightbox v-model:open="open" v-model:index="at" :images="shots" />`,
};

export function kitEntry(id: string): KitEntry {
  const e = KIT_ENTRIES.find((x) => x.id === id);
  if (!e) throw new Error(`No kit entry "${id}"`);
  return e;
}
