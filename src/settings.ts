import {
    BOARD_CONFIG,
    Config,
    FIRST_CLICK,
    HINT_MODE,
    Mode,
    MODE_NAME,
    MIN_MINES_TO_CELLS_RATIO,
    MAX_MINES_TO_CELLS_RATIO,
} from "./config.js";
import { EVENT_HINT_MODE_CHANGED, EVENT_MODE_CHANGED, EVENT_SETTINGS_CHANGED, PubSub } from "./util/pub-sub.js";
import { isTouchDevice, getDeviceBoardArea, computeDeviceMode } from "./util/device.js";

interface SettingDefinition {
    legend: string;
    /** Omitted when the setting applies to every device. */
    show?: () => boolean;
}

const AVAILABLE_SETTINGS = {
    // Dimensions come from the screen on touch, so the presets can't change anything.
    mode: { legend: "Mode", show: () => !isTouchDevice() },
    // Density only shapes device-derived boards, which desktop never builds.
    mineDensity: { legend: "Mine density", show: isTouchDevice },
    firstClick: { legend: "First click" },
    hintMode: { legend: "Hint shows" },
    // `body.dark` only repaints the page behind `main`, and a touch board covers the
    // viewport edge to edge — the toggle has nothing visible to change.
    darkMode: { legend: "Dark mode", show: () => !isTouchDevice() },
    about: { legend: "About" },
    // `satisfies`, not an annotation: the literal keys have to survive for
    // `keyof typeof` to keep `drawFieldset`'s switch exhaustive.
} satisfies Record<string, SettingDefinition>;

/** The slider works in whole percent so dragging can't accumulate float drift. */
function toPercent(ratio: number): number {
    return Math.round(ratio * 100);
}

export class Settings {

    constructor(private el: HTMLElement, private config: Config) {
        this.draw();
        PubSub.subscribe(EVENT_MODE_CHANGED, this.redraw.bind(this));
    }

    private redraw() {
        this.el.replaceChildren();
        this.draw();
    }

    private draw() {
        Object.keys(AVAILABLE_SETTINGS).forEach(settingKey => {
            const key = settingKey as keyof typeof AVAILABLE_SETTINGS;
            // Widening to the interface is what makes the optional `show` readable
            // here — indexing the table alone yields a union that lacks it.
            const setting: SettingDefinition = AVAILABLE_SETTINGS[key];

            if (setting.show != null && !setting.show()) {
                return;
            }

            const fieldset = document.createElement("fieldset");
            this.el.appendChild(fieldset)

            const legend = document.createElement("legend");
            legend.textContent = setting.legend;
            fieldset.appendChild(legend);
            this.drawFieldset(key, fieldset);
        })
    }

    private drawFieldset(setting: keyof typeof AVAILABLE_SETTINGS, settingFieldset: HTMLElement) {
        settingFieldset.querySelectorAll(":not(legend)").forEach(e => e.remove());
        switch (setting) {
            case "mode": this.drawMode(settingFieldset); break;
            case "mineDensity": this.drawMineDensity(settingFieldset); break;
            case "firstClick": this.drawFirstClick(settingFieldset); break;
            case "hintMode": this.drawHintMode(settingFieldset); break;
            case "darkMode": this.drawDarkMode(settingFieldset); break;
            case "about": this.drawAbout(settingFieldset); break;
        }
    }

    private drawMode(fieldset: HTMLElement) {
        const modeSwitchWrapper = document.createElement("div");
        modeSwitchWrapper.id = "mode_switch_wrapper";
        fieldset.append(modeSwitchWrapper);

        Object.entries(MODE_NAME).forEach(([modeKey, modeValue]) => {
            if (BOARD_CONFIG[modeValue] == null) {
                return;
            }

            this.drawModeSwitch(modeSwitchWrapper, modeKey, modeValue, fieldset);
        });

        const modeDetailsWrapper = document.createElement("div");
        modeDetailsWrapper.id = "mode_details_wrapper";
        fieldset.append(modeDetailsWrapper);
        Object.keys(BOARD_CONFIG[MODE_NAME.Beginner]!).forEach(modeProperty => {
            this.drawModeDetails(modeDetailsWrapper, modeProperty);
        });
    }

    private drawMineDensity(fieldset: HTMLElement) {
        const wrapper = document.createElement("div");
        wrapper.id = "density_wrapper";
        fieldset.appendChild(wrapper);

        const readout = document.createElement("label");
        readout.setAttribute("for", "densitySlider");
        wrapper.appendChild(readout);

        const slider = document.createElement("input");
        slider.setAttribute("type", "range");
        slider.setAttribute("id", "densitySlider");
        slider.min = toPercent(MIN_MINES_TO_CELLS_RATIO).toString();
        slider.max = toPercent(MAX_MINES_TO_CELLS_RATIO).toString();
        slider.step = "1";
        slider.value = toPercent(this.config.mobileMineDensity).toString();
        wrapper.appendChild(slider);

        // The ratio behind the slider is an implementation detail; the mine count it
        // produces on this screen is the thing a player can actually reason about.
        const describe = () => {
            const area = getDeviceBoardArea();
            const mode = computeDeviceMode(area.width, area.height, Number(slider.value) / 100);
            readout.textContent = `${mode.mines} mines`;
        };

        describe();

        // Dragging only moves the readout. Rebuilding the board on every input event
        // would regenerate it dozens of times per drag, so that waits for the release.
        slider.addEventListener("input", describe);
        slider.addEventListener("change", () => {
            this.config.mobileMineDensity = Number(slider.value) / 100;
            PubSub.publish(EVENT_SETTINGS_CHANGED);
        });
    }

    private drawFirstClick(fieldset: HTMLElement) {
        const options: { label: string, value: FIRST_CLICK }[] = [
            { label: "Guaranteed non-mine", value: FIRST_CLICK.GuaranteedNonMine },
            { label: "Guaranteed cascade", value: FIRST_CLICK.GuaranteedCascade },
        ];
        options.forEach(({ label, value }) => {
            this.drawRadioButton(fieldset, "firstClick", label, value.toString(), this.config.firstClick == value, () => {
                this.config.firstClick = value;
                this.drawFieldset("firstClick", fieldset);
                PubSub.publish(EVENT_SETTINGS_CHANGED);
            });
        });
    }

    private drawHintMode(fieldset: HTMLElement) {
        const options: { label: string, value: HINT_MODE }[] = [
            { label: "Mines", value: HINT_MODE.Mines },
            { label: "Safe cells", value: HINT_MODE.Safe },
        ];
        options.forEach(({ label, value }) => {
            this.drawRadioButton(fieldset, "hintMode", label, value, this.config.hintMode === value, () => {
                this.config.hintMode = value;
                this.drawFieldset("hintMode", fieldset);
                // Only changes what the hint button reveals — no board reset, so
                // this deliberately doesn't publish EVENT_SETTINGS_CHANGED.
                PubSub.publish(EVENT_HINT_MODE_CHANGED);
            });
        });
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
        const modeConfig = BOARD_CONFIG[modeValue]!;
        const rows = modeConfig.rows;
        const cols = modeConfig.cols;
        const mines = modeConfig.mines;
        const current = rows == BOARD_CONFIG[this.config.mode]?.rows &&
            cols == BOARD_CONFIG[this.config.mode]?.cols &&
            mines == BOARD_CONFIG[this.config.mode]?.mines;

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
        const currentModeConfig = BOARD_CONFIG[this.config.mode];
        input.setAttribute("value", currentModeConfig == null ? "" : currentModeConfig[modeProperty as keyof Mode].toString());
        input.disabled = true;
        wrapper.appendChild(input);
        parent.appendChild(wrapper);
    }

    private drawRadioButton(parent: HTMLElement, name: string, labelText: string, value: string, checked: boolean, onSelect: () => void) {
        const wrapper = document.createElement("div");
        parent.appendChild(wrapper);

        const id = `${name}_${value}`;

        const label = document.createElement("label");
        label.textContent = labelText;
        label.setAttribute("for", id);
        wrapper.appendChild(label);

        const radio = document.createElement("input")
        radio.setAttribute("type", "radio")
        radio.setAttribute("id", id)
        radio.setAttribute("name", name)
        radio.checked = checked;
        if (!checked) {
            radio.addEventListener("click", onSelect);
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
        const configKey = target.getAttribute("data-configKey");
        if (configKey == null) {
            return;
        }
        // Dynamic write of a config field (mode) from a DOM attribute string
        (this.config as any)[configKey] = target.getAttribute("data-configValue");
        this.drawFieldset(configKey as keyof typeof AVAILABLE_SETTINGS, fieldset);
        PubSub.publish(EVENT_SETTINGS_CHANGED)
    }

    private toggleDarkMode() {
        const state = document.body.classList.toggle("dark");
        document.getElementById("darkModeCheckbox")!.setAttribute("checked", String(state));
    }

}
