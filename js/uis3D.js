function containerMain3d(model) {
    const container_main = document.createElement("div");
    container_main.innerHTML = `
        <div style="display: flex; width: 100%; height: auto; flex-direction: column; align-items: center; gap: 10px;">
            <div id="toolbar" style="display: flex; flex-wrap; flex-direction: column; align-items: center; width: 100%; gap: 8px; padding: 8px; background: ${model.get("dark_mode") ? '#2d3748' : '#f7fafc'}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); box-sizing: border-box;">

                <div id="slice-selection" style="display: flex; flex-wrap; align-items: center; gap: 8px;">
                </div>

                <div id="navigator"       style="display: flex; flex-wrap; align-items: center;  gap: 8px; padding: 6px 12px; border: 1px solid #cbd5e0; border-radius: 4px; background: ${model.get("dark_mode") ? '#4a5568' : 'white'}; color: ${model.get("dark_mode") ? 'white' : 'black'};">
                </div>

                <div id="general-controllers" style="display: flex; align-items: center; gap: 8px;">
                </div>

            </div>
            <div id="canvas-container" style="position: relative; width: 100%; height: ${model.get("height") || 800 }px; border: 1px solid ${model.get("dark_mode") ? 'white' : 'black'}; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Canvas will be inserted here -->
            </div>
        </div>
    `

    return container_main;
};


function create3DToolbarButton(model, text, onClick, isActive = false) {
    const button = document.createElement("button");
    button.innerHTML = text;
    button.style.cssText = `
        padding: 6px 12px;
        border: 1px solid #cbd5e0;
        border-radius: 4px;
        background: ${isActive ? (model.get("dark_mode") ? "#4a5568" : "#e2e8f0") : (model.get("dark_mode") ? "#4a5568" : "white")};
        color: ${model.get("dark_mode") ? "white" : "black"};
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    `;

    button.addEventListener("mouseenter", () => {
        button.style.background = model.get("dark_mode") ? "#718096" : "#edf2f7";
    });
    button.addEventListener("mouseleave", () => {
        button.style.background = isActive ?
            (model.get("dark_mode") ? "#4a5568" : "#e2e8f0") :
            (model.get("dark_mode") ? "#4a5568" : "white");
    });

    button.addEventListener("click", onClick);
    return button;
};

function create3DToolbarSelection(model, text, selections, eventListenerCallback = () => {}, isActive = false) {
    // Label selection
    const labelSelect = document.createElement("div");
    labelSelect.style.display = "flex";
    labelSelect.style.padding = "6px 12px";
    labelSelect.style.border = "1px solid #cbd5e0";
    labelSelect.style.width = "max-content";
    labelSelect.style.borderRadius = "4px";
    labelSelect.style.background = model.get("dark_mode") ? "#4a5568" : "white";
    labelSelect.style.color = model.get("dark_mode") ? "white" : "black";
    labelSelect.style.alignItems = "center";
    labelSelect.innerHTML = ``;
    if (selections) {
        let clab = 0;
        selections.forEach((lab) => {
            labelSelect.innerHTML += `
                <label style="display: inline-block; margin-right: 12px; cursor: pointer;">
                    <input type="radio" name="toolbarSelection" value="${clab}" style="margin-right: 4px;"> ${lab} </label> `;
            clab += 1;
        });
    }
    // labelSelect
    return labelSelect
};


function create3DStyledSlider(
    data = {
        model : {},
        sliderId : "",
        min : 0,
        max : 1,
        index : 0,
        sliceType : "inline",
        sliceValueByIndex : [0, 0, 0],
    }
) {
    const container = document.createElement("div");
    container.innerHTML = `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; margin: 4px 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                <div id="label-incre-${data.sliderId}" style="color: ${data.model.get("dark_mode") ? "white" : "black"}; font-size: 14px; min-width: 60px;">Increment</div>
                <input type="number" id="incre-${data.sliderId}" name="Increment" min="${data.min}" max="${data.max}" value="${data.max >= 50? 10 : 1}" style="flex: 1; padding: 4px 0;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                <div id="label-${data.sliderId}" style="color: ${data.model.get("dark_mode") ? "white" : "black"}; font-size: 14px; min-width: 60px;">${data.sliceType}</div>
                <input type="range" id="${data.sliderId}" min="${data.min}" max="${data.max}" value="${data.sliceValueByIndex[data.index]}" style="flex: 1; padding: 4px 0;">
                <div id="label_${data.sliderId}" style="color: ${data.model.get("dark_mode") ? "white" : "black"}; font-size: 14px; min-width: 30px; text-align: center;">${data.sliceValueByIndex[data.index]}</div>
            </div>
        </div>
    `;

    const slider = container.querySelector(`#${data.sliderId}`);
    const valueSpan = container.querySelector(`#label_${data.sliderId}`);
    const label = container.querySelector(`#label-${data.sliderId}`);

    const valueIncrement = container.querySelector(`#incre-${data.sliderId}`);

    // Initialize value
    valueSpan.textContent = slider.value;

    return {
        container: container,
        slider: slider,
        valueSpan: valueSpan,
        getValueIncre: () => parseInt(valueIncrement.value),
        getValue: () => parseInt(slider.value),
        setValue: (newValue, newSliceType, dim, value) => {

            // data.sliceValueByIndex[value] = newValue;

            label.textContent = `${newSliceType}`;
            valueSpan.textContent = newValue.toString();

            slider.value = newValue.toString();
            slider.max = (dim[newSliceType]-1).toString();

            // slider.addEventListener("input", (idx) => {
            //     const sliderValue = parseInt(slider.value);
            //     valueSpan.textContent = sliderValue;
            //     data.sliceValueByIndex[idx] = sliderValue;
            //     // Send message to Python
            // });

        }
    };
}

export {
    containerMain3d,
    create3DToolbarButton,
    create3DToolbarSelection,
    create3DStyledSlider,
};
