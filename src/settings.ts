import { BOARD_CONFIG, Config, FIRST_CLICK, MODE_NAME } from "./config";
import { EVENT_SETTINGS_CHANGED, PubSub } from "./util/pub-sub";

export class Settings {

    constructor(private el: HTMLElement, private config: Config) {
        this.draw();
    }

    private draw() {
        this.el.textContent = "";

        // Mode
        const modeFieldset = document.createElement("fieldset");
        this.el.appendChild(modeFieldset)

        const modeLegend = document.createElement("legend");
        modeLegend.textContent = "Mode";
        modeFieldset.appendChild(modeLegend);

        Object.keys(MODE_NAME).forEach(modeKey => {
            const modeValue = MODE_NAME[modeKey];
            if (BOARD_CONFIG[modeValue] == null) {
                return;
            }

            this.drawMode(modeFieldset, modeKey, modeValue);
        });

        // First Click
        const firstClickFieldset = document.createElement("fieldset");
        this.el.appendChild(firstClickFieldset)

        const firstClickLegend = document.createElement("legend");
        firstClickLegend.textContent = "First click";
        firstClickFieldset.appendChild(firstClickLegend);

        Object.keys(FIRST_CLICK).forEach(firstClickKey => {
            if (!isNaN(Number(firstClickKey))) {
                return;
            }

            this.drawRadioButton(
                firstClickFieldset,
                firstClickKey,
                "firstClick",
                FIRST_CLICK[firstClickKey],
                this.config.firstClick == FIRST_CLICK[firstClickKey]);
        })

        // Save button
        const btn = document.createElement("button")
        btn.addEventListener("click", this.publishConfig.bind(this))
        btn.textContent = "Save"
        this.el.appendChild(btn);
    }

    private drawMode(parent: HTMLElement, modeKey: string, modeValue: MODE_NAME) {
        const rows = BOARD_CONFIG[modeValue].rows;
        const cols = BOARD_CONFIG[modeValue].cols;
        const mines = BOARD_CONFIG[modeValue].mines;
        const current = rows == BOARD_CONFIG[this.config.mode].rows &&
            cols == BOARD_CONFIG[this.config.mode].cols &&
            mines == BOARD_CONFIG[this.config.mode].mines;

        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-configKey", "mode")
        wrapper.setAttribute("data-configValue", modeValue)
        wrapper.addEventListener("click", this.updateConfig.bind(this));
        if (current) {
            wrapper.style.fontWeight = "bold";
            wrapper.style.color = "#ff0000";
        }
        wrapper.textContent = modeKey;

        const r = document.createElement("div");
        r.textContent = `Rows: ${rows}`;
        wrapper.appendChild(r);

        const c = document.createElement("div");
        c.textContent = `Columns: ${cols}`;
        wrapper.appendChild(c);

        const mn = document.createElement("div");
        mn.textContent = `Mines: ${mines}`;
        wrapper.appendChild(mn);

        parent.appendChild(wrapper);
    }

    private drawRadioButton(parent: HTMLElement, labelText: string, name: string, value: string, checked: boolean) {
        const wrapper = document.createElement("div");
        parent.appendChild(wrapper);

        const id = labelText.replace(" ", "_");

        const label = document.createElement("label");
        label.textContent = labelText
        label.setAttribute("for", id);
        wrapper.appendChild(label);

        const radio = document.createElement("input")
        radio.setAttribute("type", "radio")
        radio.setAttribute("id", id)
        radio.setAttribute("name", name)
        radio.setAttribute("data-configKey", name)
        radio.setAttribute("data-configValue", value);
        radio.checked = checked;
        radio.addEventListener("click", this.updateConfig.bind(this));
        wrapper.appendChild(radio)
    }

    private updateConfig(e) {
        this.config[e.target.getAttribute("data-configKey")] = e.target.getAttribute("data-configValue");
        this.draw();
    }

    private publishConfig(e) {
        PubSub.publish(EVENT_SETTINGS_CHANGED, this.config);
    }

}
