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

            this.drawModeSwitch(modeFieldset, modeKey, modeValue);
        });

        Object.keys(BOARD_CONFIG[MODE_NAME.Beginner]).forEach(modeProperty => {
            this.drawModeDetails(modeFieldset, modeProperty);
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

        // Dark mode switch
        const darkModeFieldset = document.createElement("fieldset");
        this.el.appendChild(darkModeFieldset)

        const darkModeLegend = document.createElement("legend");
        darkModeLegend.textContent = "Dark mode";
        darkModeFieldset.appendChild(darkModeLegend);

        const darkModeWrapper = document.createElement("div");
        darkModeFieldset.appendChild(darkModeWrapper);

        const darkModeLabel = document.createElement("label");
        darkModeLabel.setAttribute("for", "darkModeCheckbox");
        darkModeLabel.textContent = "Dark mode"
        darkModeFieldset.append(darkModeLabel);

        const darkModeCheckbox = document.createElement("input");
        darkModeCheckbox.setAttribute("type", "checkbox");
        darkModeCheckbox.setAttribute("id", "darkModeCheckbox");
        darkModeCheckbox.addEventListener("click", this.toggleDarkMode.bind(this));
        darkModeCheckbox.toggleAttribute("checked", this.config.darkModeOn);
        darkModeFieldset.appendChild(darkModeCheckbox);

        // About
        const aboutFieldset = document.createElement("fieldset");
        this.el.appendChild(aboutFieldset)

        const aboutLegend = document.createElement("legend");
        aboutLegend.textContent = "About";

        const versionWrapper = document.createElement("div");
        const versionLink = document.createElement("a");
        versionLink.setAttribute("href", `http://github.com/${this.config.github.owner}/${this.config.github.repo}/releases/latest`);
        versionLink.setAttribute("target", "blank");
        versionLink.setAttribute("title", "Check out the changelog");
        fetch(`https://api.github.com/repos/${this.config.github.owner}/${this.config.github.repo}/releases/latest`, { method: "GET", headers: {} })
            .then(resp => resp.json())
            .then(body => versionLink.textContent = `Version ${body.tag_name.substring(1)}`);
        versionWrapper.appendChild(versionLink);
        aboutFieldset.appendChild(versionWrapper);

        const ghWrapper = document.createElement("div");
        const ghLink = document.createElement("a");
        ghLink.setAttribute("href", `https://github.com/${this.config.github.owner}/${this.config.github.repo}`);
        ghLink.setAttribute("target", "blank");
        ghLink.setAttribute("title", "Find the source code at GitHub");
        ghLink.textContent = "GitHub";
        ghWrapper.appendChild(ghLink);
        aboutFieldset.appendChild(ghWrapper);

        aboutFieldset.appendChild(aboutLegend);

        // Save button
        const btn = document.createElement("button")
        btn.addEventListener("click", this.publishConfig.bind(this))
        btn.textContent = "Apply"
        this.el.appendChild(btn);
    }

    private drawModeSwitch(parent: HTMLElement, modeKey: string, modeValue: MODE_NAME) {
        const rows = BOARD_CONFIG[modeValue].rows;
        const cols = BOARD_CONFIG[modeValue].cols;
        const mines = BOARD_CONFIG[modeValue].mines;
        const current = rows == BOARD_CONFIG[this.config.mode].rows &&
            cols == BOARD_CONFIG[this.config.mode].cols &&
            mines == BOARD_CONFIG[this.config.mode].mines;

        const modeButton = document.createElement("span");
        modeButton.setAttribute("data-configKey", "mode")
        modeButton.setAttribute("data-configValue", modeValue)
        modeButton.addEventListener("click", this.updateConfig.bind(this));
        if (current) {
            modeButton.style.fontWeight = "bold";
            modeButton.style.color = "#ff0000";
        }
        modeButton.textContent = modeKey;

        parent.appendChild(modeButton);
    }

    private drawModeDetails(parent: HTMLElement, modeProperty: string) {
        const wrapper = document.createElement("div");
        const label = document.createElement("label");
        label.textContent = modeProperty.charAt(0).toUpperCase() + modeProperty.slice(1);
        label.setAttribute("for", `${modeProperty}Input`);
        wrapper.appendChild(label);
        const input = document.createElement("input");
        input.setAttribute("type", "number");
        input.setAttribute("id", `${modeProperty}Input`);
        input.setAttribute("value", BOARD_CONFIG[this.config.mode][modeProperty].toString());
        input.disabled = true;
        wrapper.appendChild(input);
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

    private toggleDarkMode(e) {
        const state = document.body.classList.toggle("dark");
        document.getElementById("darkModeCheckbox").setAttribute("checked", String(state));
    }

    private publishConfig(e) {
        PubSub.publish(EVENT_SETTINGS_CHANGED, this.config);
    }

}
