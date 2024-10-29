// State Machine for LineAr Drawing Application
const states = {
    NORMAL_DRAWING: 'NORMAL_DRAWING',
    ROBOT_DRAWING: 'ROBOT_DRAWING',
    REAL_TIME_DRAWING: 'REAL_TIME_DRAWING',
};

let currentState = states.NORMAL_DRAWING;

// Canvas setup
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const sendButton = document.getElementById('sendButton');
const cancelButton = document.getElementById('cancelButton');
const clearButton = document.getElementById('clearButton');
const realTimeSwitch = document.getElementById('realTimeSwitch');
const loader = document.getElementById('loader');  // Loader element
let isDrawing = false;

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);  // Stop drawing if the mouse leaves the canvas
canvas.addEventListener('mousemove', draw);

function startDrawing(event) {
    if (canvas.disabled) return; // Prevent drawing when canvas is disabled
    isDrawing = true;
    ctx.beginPath(); // Start a new path when drawing begins
    const { x, y } = getMousePosition(event);
    ctx.moveTo(x, y); // Move to the initial mouse position
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath(); // Reset path when drawing stops
}

function draw(event) {
    if (!isDrawing || canvas.disabled) return;  // Only draw when the mouse button is pressed and canvas is enabled

    const { x, y } = getMousePosition(event);

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#333';

    // Draw a line to the current mouse position
    ctx.lineTo(x, y);
    ctx.stroke();
    // Start a new path from the current mouse position
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Function to get the mouse position relative to the canvas
function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();  // Get the canvas' position relative to the viewport
    return {
        x: event.clientX - rect.left,  // Adjust the X coordinate
        y: event.clientY - rect.top    // Adjust the Y coordinate
    };
}

// State Machine Functions
function changeState(newState) {
    currentState = newState;
    updateUI();
}
function updateUI() {
    switch (currentState) {
        case states.NORMAL_DRAWING:
            enableElement(canvas);
            enableElement(sendButton);
            enableElement(clearButton);
            enableElement(realTimeSwitch);  // Enable real-time checkbox in normal drawing
            disableElement(cancelButton, true);
            canvas.classList.remove('disabled');  // Remueve el estilo de deshabilitado
            hideLoader();  // Hide loader when not in Robot Drawing state
            break;

        case states.ROBOT_DRAWING:
            disableElement(canvas);
            disableElement(sendButton);
            disableElement(clearButton);
            disableElement(realTimeSwitch); // Disable real-time checkbox in robot drawing
            enableElement(cancelButton, false);
            canvas.classList.add('disabled');  // Añade el estilo de deshabilitado
            showLoader();  // Show loader when in Robot Drawing state
            break;

        case states.REAL_TIME_DRAWING:
            enableElement(canvas);
            disableElement(sendButton);
            enableElement(clearButton);
            enableElement(realTimeSwitch);  // Enable real-time checkbox in real-time drawing
            disableElement(cancelButton, true);
            canvas.classList.remove('disabled');  // Remueve el estilo de deshabilitado
            hideLoader();  // Hide loader in Real-time Drawing state
            break;
    }
}

// Utility Functions to Enable/Disable Elements
function enableElement(element, invisible = false) {
    element.disabled = false;
    element.style.opacity = 1;
    element.style.cursor = 'pointer';
    if (invisible) element.style.display = 'none';
    else element.style.display = 'inline-block';
}

function disableElement(element, invisible = false) {
    element.disabled = true;
    element.style.opacity = 0.5;
    element.style.cursor = 'not-allowed';
    if (invisible) element.style.display = 'none';
    else element.style.display = 'inline-block';
}

// Loader control functions
// Loader control functions
function showLoader() {
    loader.style.display = 'block';  // Asegura que el loader esté visible
    setTimeout(() => {  // Añade un pequeño retraso para que la transición ocurra correctamente
        loader.classList.add('show');  // Añade la clase 'show' para cambiar la opacidad a 1
    }, 10);
}

function hideLoader() {
    loader.classList.remove('show');  // Remueve la clase 'show' para que la opacidad regrese a 0
    setTimeout(() => {
        loader.style.display = 'none';  // Oculta el loader después de que la transición de opacidad haya terminado
    }, 500);  // El tiempo debe coincidir con el valor de la transición en CSS
}


// Clear Button
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas
    if (currentState === states.ROBOT_DRAWING || currentState === states.NORMAL_DRAWING) {
        changeState(states.NORMAL_DRAWING);
    }
});

// Send Button
sendButton.addEventListener('click', () => {
    changeState(states.ROBOT_DRAWING);

    const drawingData = canvas.toDataURL(); // Get canvas image data
    const coordinates = getCoordinates();   // Function to capture canvas coordinates (you need to implement)

    // Show loader when sending data
    showLoader();

    // Send data to the backend
    fetch('http://backend:5000/receive-coordinates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ drawing: drawingData, coordinates: coordinates })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Backend finished drawing:', data);
        changeState(states.NORMAL_DRAWING);  // Transition back to normal drawing when finished
        hideLoader();  // Hide the loader when done
    })
    .catch(error => {
        console.error('Error sending data to backend:', error);
        changeState(states.NORMAL_DRAWING);  // Also revert if there's an error
        hideLoader();  // Hide the loader in case of error
    });
});

// Cancel Button
cancelButton.addEventListener('click', () => {
    changeState(states.NORMAL_DRAWING);
    hideLoader();  // Hide the loader if the user cancels
    // Logic to send cancellation to the backend can be added here
});

// Real-time Drawing Switch
realTimeSwitch.addEventListener('change', (event) => {
    if (event.target.checked) {
        changeState(states.REAL_TIME_DRAWING);
        // Logic to continuously send drawing data in real-time can be added here
    } else {
        changeState(states.NORMAL_DRAWING);
    }
});

// Initialize in the default state
updateUI();

