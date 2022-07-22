import { BOARD_CONFIG, Config, FIRST_CLICK, MODE_NAME } from "./config";
import { EVENT_SETTINGS_CHANGED, PubSub } from "./util/pub-sub";

enum AVAILABLE_SETTINGS {
    mode = "Mode",
    firstClick = "First click",
    darkMode = "Dark mode",
    about = "About",
}

export class Settings {

    constructor(private el: HTMLElement, private config: Config) {
        this.draw();
    }

    private draw() {
        Object.keys(AVAILABLE_SETTINGS).forEach(settingKey => {
            const key = settingKey as keyof typeof AVAILABLE_SETTINGS;
            const fieldset = document.createElement("fieldset");
            this.el.appendChild(fieldset)

            const legend = document.createElement("legend");
            legend.textContent = AVAILABLE_SETTINGS[key];
            fieldset.appendChild(legend);
            this.drawFieldset(key, fieldset);
        })
    }

    private drawFieldset(setting: keyof typeof AVAILABLE_SETTINGS, settingFieldset: HTMLElement) {
        settingFieldset.querySelectorAll(":not(legend)").forEach(e => e.remove());
        switch (setting) {
            case "mode": this.drawMode(settingFieldset); break;
            case "firstClick": this.drawFirstClick(settingFieldset); break;
            case "darkMode": this.drawDarkMode(settingFieldset); break;
            case "about": this.drawAbout(settingFieldset); break;
        }
    }

    private drawMode(fieldset: HTMLElement) {
        const modeSwitchWrapper = document.createElement("div");
        modeSwitchWrapper.id = "mode_switch_wrapper";
        fieldset.append(modeSwitchWrapper);

        Object.keys(MODE_NAME).forEach(modeKey => {
            const modeValue = MODE_NAME[modeKey];
            if (BOARD_CONFIG[modeValue] == null) {
                return;
            }

            this.drawModeSwitch(modeSwitchWrapper, modeKey, modeValue, fieldset);
        });

        const modeDetailsWrapper = document.createElement("div");
        modeDetailsWrapper.id = "mode_details_wrapper";
        fieldset.append(modeDetailsWrapper);
        Object.keys(BOARD_CONFIG[MODE_NAME.Beginner]).forEach(modeProperty => {
            this.drawModeDetails(modeDetailsWrapper, modeProperty);
        });
    }

    private drawFirstClick(fieldset: HTMLElement) {
        Object.keys(FIRST_CLICK).forEach(firstClickKey => {
            if (!isNaN(Number(firstClickKey))) {
                return;
            }

            this.drawRadioButton(
                fieldset,
                firstClickKey,
                "firstClick",
                FIRST_CLICK[firstClickKey],
                this.config.firstClick == FIRST_CLICK[firstClickKey]);
        })
    }

    private drawDarkMode(fieldset: HTMLElement) {
        const darkModeWrapper = document.createElement("div");
        fieldset.appendChild(darkModeWrapper);

        const darkModeLabel = document.createElement("label");
        darkModeLabel.setAttribute("for", "darkModeCheckbox");
        darkModeLabel.textContent = "Enabled"
        fieldset.append(darkModeLabel);

        const darkModeCheckbox = document.createElement("input");
        darkModeCheckbox.setAttribute("type", "checkbox");
        darkModeCheckbox.setAttribute("id", "darkModeCheckbox");
        darkModeCheckbox.addEventListener("click", this.toggleDarkMode.bind(this));
        darkModeCheckbox.toggleAttribute("checked", this.config.darkModeOn);
        fieldset.appendChild(darkModeCheckbox);
    }

    private drawAbout(fieldset: HTMLElement) {
        const versionWrapper = document.createElement("div");
        const versionLink = document.createElement("a");
        versionLink.setAttribute("href", `http://github.com/${this.config.github.owner}/${this.config.github.repo}/releases/latest`);
        versionLink.setAttribute("target", "_blank");
        versionLink.setAttribute("title", "Check out the changelog");
        fetch(`https://api.github.com/repos/${this.config.github.owner}/${this.config.github.repo}/releases/latest`, { method: "GET", headers: {} })
            .then(resp => resp.json())
            .then(body => versionLink.textContent = `Version ${body.tag_name.substring(1)}`);
        versionWrapper.appendChild(versionLink);
        fieldset.appendChild(versionWrapper);

        const ghWrapper = document.createElement("div");
        const ghLink = document.createElement("a");
        ghLink.setAttribute("href", `https://github.com/${this.config.github.owner}/${this.config.github.repo}`);
        ghLink.setAttribute("target", "_blank");
        ghLink.setAttribute("title", "Find the source code at GitHub");
        ghLink.textContent = "Project's repo";
        ghWrapper.appendChild(ghLink);
        fieldset.appendChild(ghWrapper);

        const reportBugWrapper = document.createElement("div");
        const reportBugLink = document.createElement("a");
        reportBugLink.setAttribute("href", this.generateBugReportUrl());
        reportBugLink.setAttribute("target", "_blank");
        reportBugLink.setAttribute("title", "Report a bug");
        reportBugLink.textContent = "Report a bug";
        reportBugWrapper.appendChild(reportBugLink);
        fieldset.appendChild(reportBugWrapper);
    }

    private drawModeSwitch(parent: HTMLElement, modeKey: string, modeValue: MODE_NAME, fieldset: HTMLElement) {
        const rows = BOARD_CONFIG[modeValue].rows;
        const cols = BOARD_CONFIG[modeValue].cols;
        const mines = BOARD_CONFIG[modeValue].mines;
        const current = rows == BOARD_CONFIG[this.config.mode].rows &&
            cols == BOARD_CONFIG[this.config.mode].cols &&
            mines == BOARD_CONFIG[this.config.mode].mines;

        const modeButton = document.createElement("div");
        modeButton.setAttribute("data-configKey", "mode")
        modeButton.setAttribute("data-configValue", modeValue)
        if (current) {
            modeButton.classList.add("active");
        } else {
            modeButton.addEventListener("click", this.updateConfig.bind(this, fieldset));
        }
        modeButton.title = modeKey;

        parent.appendChild(modeButton);
    }

    private drawModeDetails(parent: HTMLElement, modeProperty: string) {
        const wrapper = document.createElement("div");
        wrapper.className = "mode-detail";
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

        const label = document.createElement("label");
        label.textContent =
            labelText == FIRST_CLICK[FIRST_CLICK.GuaranteedNonMine]
                ? "Guaranteed non-mine"
                : "Guaranteed cascade";
        label.setAttribute("for", labelText);
        wrapper.appendChild(label);

        const radio = document.createElement("input")
        radio.setAttribute("type", "radio")
        radio.setAttribute("id", labelText)
        radio.setAttribute("name", name)
        radio.setAttribute("data-configKey", name)
        radio.setAttribute("data-configValue", value);
        radio.checked = checked;
        if (!checked) {
            radio.addEventListener("click", this.updateConfig.bind(this, parent));
        }
        wrapper.appendChild(radio);
    }

    private generateBugReportUrl(): string {
        const title = "I found a bug!";
        const body = `**Describe the bug**
<!-- Explain with a few words what's wrong and how you expect it to work -->

**Screenshots**
<!-- Attach a screenshot if you have one -->
        
**URL**
${window.location.href}

**User Agent**
${navigator.userAgent}`;

        return `http://github.com/${this.config.github.owner}/${this.config.github.repo}/issues/new` +
            `?assignees=${this.config.github.owner}` +
            `&labels=bug` +
            `&title=${encodeURIComponent(title)}` +
            `&body=${encodeURIComponent(body)}`;
    }

    private updateConfig(fieldset: HTMLElement, e: MouseEvent) {
        const target = e.currentTarget as HTMLElement;
        this.config[target.getAttribute("data-configKey")] = target.getAttribute("data-configValue");
        this.drawFieldset(target.getAttribute("data-configKey") as keyof typeof AVAILABLE_SETTINGS, fieldset);
        PubSub.publish(EVENT_SETTINGS_CHANGED, this.config)
    }

    private toggleDarkMode() {
        const state = document.body.classList.toggle("dark");
        document.getElementById("darkModeCheckbox").setAttribute("checked", String(state));
    }

}
