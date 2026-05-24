const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const particles = [];

function toKelvin(val, unit) {
    if (unit === 'K') return val;
    if (unit === 'C') return val + 273.15;
    if (unit === 'F') return (val - 32) * 5/9 + 273.15;
    return val;
}

function toAtm(val, unit) {
    if (unit === 'atm') return val;
    if (unit === 'kPa') return val / 101.325;
    if (unit === 'psi') return val / 14.6959;
    if (unit === 'bar') return val / 1.01325;
    return val;
}


function showTemperatureConversion(inputId, convertedId, unitSelectId) {
    const value = parseFloat(document.getElementById(inputId).value);
    const unit = document.getElementById(unitSelectId).value;
    
    if (isNaN(value)) {
        document.getElementById(convertedId).textContent = "";
        return;
    }

    const kelvin = toKelvin(value, unit);
    let text = "";

    if (unit === 'C') text = `${value} °C + 273.15 = ${kelvin.toFixed(2)} K`; 
    else if (unit === 'F') text = `${value}  °F - 32 * 5/9 + 273.15 = ${kelvin.toFixed(2)} K`;
    else text = `${value} K (already in Kelvin)`;

    document.getElementById(convertedId).textContent = text;
}

function showPressureConversion(inputId, convertedId, unitSelectId) {
    const value = parseFloat(document.getElementById(inputId).value);
    const unit = document.getElementById(unitSelectId).value;
    
    if (isNaN(value)) {
        document.getElementById(convertedId).textContent = "";
        return;
    }

    const atm = toAtm(value, unit);
    let text = "";

    if (unit === 'atm') text = `${value} atm (already in atm)`;
    else if (unit === 'kPa') text = `${value} kPa / 101.325 = ${atm.toFixed(4)} atm`;
    else if (unit === 'psi') text = `${value} psi / 14.6959 = ${atm.toFixed(4)} atm`;
    else if (unit === 'bar') text = `${value} bar  / 1.01325 = ${atm.toFixed(4)} atm`;

    document.getElementById(convertedId).textContent = text;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.radius = 5;
    }
    update(temp) {
        // Speed scales with sqrt of temperature (kinetic theory)
        const factor = Math.sqrt(temp / 300);
        this.x += this.vx * factor;
        this.y += this.vy * factor;

        // Bounce off walls
        if (this.x < this.radius || this.x > canvas.width - this.radius) this.vx *= -1;
        if (this.y < this.radius || this.y > canvas.height - this.radius) this.vy *= -1;
        
        // Keep particles in bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }
    draw(temp) {
        // Color shifts from blue (cold) to red (hot)
        const hue = Math.max(220 - (temp - 200) * 0.35, 0);
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
        ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Initialize particles
for (let i = 0; i < 40; i++) particles.push(new Particle());

// Simulation state
let currentTemp = 298;      // Current temperature in Kelvin (for animation)
let currentPressure = 1;    // Current pressure in atm (for animation)

// Reference values for Gay-Lussac's Law (P1/T1 = P2/T2)
let referenceTemp = 298;    // T₁ in Kelvin
let referencePressure = 1;  // P₁ in atm

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    particles.forEach(p => {
        p.update(currentTemp);
        p.draw(currentTemp);
    });

    document.getElementById('tempIndicator').textContent = `${currentTemp.toFixed(0)} K`;
    document.getElementById('pressureIndicator').textContent = `${currentPressure.toFixed(2)} atm`;

    requestAnimationFrame(animate);
}

// Main Update Function (from input fields)
function updateSimulation() {
    const t1 = parseFloat(document.getElementById('temp1').value);
    const t1Unit = document.getElementById('temp1Unit').value;
    const p1 = parseFloat(document.getElementById('pressure1').value);
    const p1Unit = document.getElementById('pressure1Unit').value;
    const t2 = parseFloat(document.getElementById('temp2').value);
    const t2Unit = document.getElementById('temp2Unit').value;

    const T1 = toKelvin(t1, t1Unit);
    const T2 = toKelvin(t2, t2Unit);
    const P1 = toAtm(p1, p1Unit);

    if (T1 <= 0 || T2 <= 0) {
        document.getElementById('pressure2Output').textContent = "Invalid Temperature";
        return;
    }

    // Gay-Lussac's Law: P1/T1 = P2/T2 → P2 = P1 * (T2/T1)
    const P2 = P1 * (T2 / T1);
    document.getElementById('pressure2Output').textContent = `${P2.toFixed(2)} atm`;

    // Update simulation state
    currentTemp = T2;
    currentPressure = P2;
    
    // Store reference values for slider calculations
    referenceTemp = T1;
    referencePressure = P1;

    // Update slider to match T2
    document.getElementById('tempSlider').value = T2;
    document.getElementById('sliderValue').textContent = `${T2.toFixed(0)} K`;

    // Update conversion displays
    showTemperatureConversion('temp1', 'temp1Converted', 'temp1Unit');
    showTemperatureConversion('temp2', 'temp2Converted', 'temp2Unit');
    showPressureConversion('pressure1', 'pressure1Converted', 'pressure1Unit');
}

// Slider handler - applies Gay-Lussac's Law in real-time
function updateFromSlider(newTemp) {
    currentTemp = newTemp;
    
    // Gay-Lussac's Law: P2 = P1 * (T2/T1)
    currentPressure = referencePressure * (currentTemp / referenceTemp);
    
    document.getElementById('sliderValue').textContent = `${currentTemp.toFixed(0)} K`;
    
    // Update the P2 output to reflect slider changes
    document.getElementById('pressure2Output').textContent = `${currentPressure.toFixed(2)} atm`;
}

// Event Listeners
document.querySelectorAll('input, select').forEach(el => {
    if (el.id !== 'tempSlider') { // Don't double-bind slider
        el.addEventListener('input', updateSimulation);
        el.addEventListener('change', updateSimulation);
    }
});

document.getElementById('tempSlider').addEventListener('input', (e) => {
    updateFromSlider(parseFloat(e.target.value));
});

document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('temp2').value = document.getElementById('temp1').value;
    document.getElementById('temp2Unit').value = document.getElementById('temp1Unit').value;
    updateSimulation();
});

// Start
updateSimulation();
animate();
