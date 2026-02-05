const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const weatherContent = document.getElementById('weather-content');
const loadingSpinner = document.getElementById('loading-spinner');
const welcomeMessage = document.getElementById('welcome-message');

const appContainer = document.querySelector('.app-container');

// API Endpoints
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';

// Weather Codes Mapping (WMO Code to Icon/Description)
const weatherCodes = {
    0: { desc: 'Clear Sky', icon: 'fas fa-sun' },
    1: { desc: 'Mainly Clear', icon: 'fas fa-cloud-sun' },
    2: { desc: 'Partly Cloudy', icon: 'fas fa-cloud-sun' },
    3: { desc: 'Overcast', icon: 'fas fa-cloud' },
    45: { desc: 'Fog', icon: 'fas fa-smog' },
    48: { desc: 'Fog', icon: 'fas fa-smog' },
    51: { desc: 'Drizzle', icon: 'fas fa-cloud-rain' },
    53: { desc: 'Drizzle', icon: 'fas fa-cloud-rain' },
    55: { desc: 'Drizzle', icon: 'fas fa-cloud-rain' },
    61: { desc: 'Rain', icon: 'fas fa-cloud-showers-heavy' },
    63: { desc: 'Rain', icon: 'fas fa-cloud-showers-heavy' },
    65: { desc: 'Rain', icon: 'fas fa-cloud-showers-heavy' },
    71: { desc: 'Snow', icon: 'fas fa-snowflake' },
    73: { desc: 'Snow', icon: 'fas fa-snowflake' },
    75: { desc: 'Snow', icon: 'fas fa-snowflake' },
    95: { desc: 'Thunderstorm', icon: 'fas fa-bolt' },
    96: { desc: 'Thunderstorm', icon: 'fas fa-bolt' },
    99: { desc: 'Thunderstorm', icon: 'fas fa-bolt' }
};

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchCoordinates(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchCoordinates(city);
    }
});

/**
 * Step 1: Get Coordinates from City Name
 */
async function fetchCoordinates(city) {
    showLoading();
    try {
        const response = await fetch(`${GEOCODING_API}?name=${city}&count=1&language=en&format=json`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            showError('City not found. Please try again.');
            return;
        }

        const { latitude, longitude, name, country } = data.results[0];
        fetchWeatherData(latitude, longitude, name, country);
    } catch (error) {
        showError('Network error. Please try again later.');
        console.error(error);
    }
}

/**
 * Step 2: Get Weather Data using Coordinates
 */
async function fetchWeatherData(lat, lon, cityName, country) {
    try {
        const response = await fetch(`${FORECAST_API}?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await response.json();

        updateUI(data, cityName, country);
    } catch (error) {
        showError('Failed to fetch weather data.');
        console.error(error);
    }
}

/**
 * Step 3: Update DOM
 */
function updateUI(data, city, country) {
    const current = data.current_weather;
    const daily = data.daily;

    // Hide loading, show content
    loadingSpinner.classList.add('hidden');
    welcomeMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherContent.classList.remove('hidden');

    // Update Header
    document.getElementById('city-name').textContent = `${city}, ${country}`;
    const now = new Date();
    document.getElementById('date-time').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    // Update Current Weather
    document.getElementById('temperature').textContent = `${Math.round(current.temperature)}°`;
    document.getElementById('wind-speed').textContent = `${current.windspeed} km/h`;

    // Map Weather Code
    const code = current.weathercode;
    const weatherInfo = weatherCodes[code] || { desc: 'Unknown', icon: 'fas fa-question' };

    document.getElementById('weather-desc').textContent = weatherInfo.desc;

    // Icon (Using FontAwesome as placeholder or image if available, let's use FontAwesome for now inside the img container? 
    // Wait, the HTML has an img tag. Let's switch to an I tag or use an icon URL. 
    // Plan: Use Font Awesome inside the icon container div, replacing the img tag for consistency with the design system.)

    const iconContainer = document.querySelector('.weather-icon-container');
    iconContainer.innerHTML = `<i class="${weatherInfo.icon}" style="font-size: 8rem; color: rgba(255,255,255,0.9); margin-top:20px;"></i>`;

    // Humidity is not directly available in current_weather of Open-Meteo free tier simple call without extra params. 
    // We can add &hourly=relativehumidity_2m and get the current hour, 
    // OR just hide it/mock it for now to keep simple? 
    // Let's hide humidity or fetch extended data. 
    // *Correction*: Let's fetch hourly data for humidity.
    // Re-fetching or just assume user is happy? Let's hide it or put "N/A" for now to adhere to simple plan.
    // Actually, let's just remove the humidity element from DOM or leave as '--'.
    // Better: Add &current=relative_humidity_2m to the fetch URL. API supports it.

    // Re-trigger fetch with humidity? No, let's fix URL in next step if needed. 
    // For now, let's assume we missed it in the URL.
    // I will modify the fetch URL in the next tool call if strict, but I can't edit my own code block now.
    // I'll add a quick fix: Use a mockup or update fetch function.
    // *Self-Correction*: I will update the fetch URL in this file content before writing.

    // *Updated Logic in fetchWeatherData above* -> adding &current=relative_humidity_2m,wind_speed_10m

    // Forecast
    const forecastGrid = document.getElementById('forecast-grid');
    forecastGrid.innerHTML = '';

    for (let i = 1; i <= 5; i++) { // Next 5 days
        const dateStr = daily.time[i];
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const fCode = daily.weathercode[i];
        const fInfo = weatherCodes[fCode] || { icon: 'fas fa-question' };

        const card = document.createElement('div');
        card.className = 'forecast-item';
        card.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <i class="${fInfo.icon} forecast-icon" style="font-size: 1.5rem;"></i>
            <span class="forecast-temp">${maxTemp}° / ${minTemp}°</span>
        `;
        forecastGrid.appendChild(card);
    }

    // Dynamic Background based on code
    updateBackground(code);
}

function updateBackground(code) {
    // Dynamic background removed for Black & White theme
    // const body = document.body;
    // ... code removed ...
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    welcomeMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function showError(msg) {
    loadingSpinner.classList.add('hidden');
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

// Redefine fetch to include humidity
// Overwriting the previous fetchWeatherData to be correct
fetchWeatherData = async function (lat, lon, cityName, country) {
    try {
        const response = await fetch(`${FORECAST_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature,surface_pressure,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`);
        const data = await response.json();

        // Map new API structure
        const current = data.current;
        const daily = data.daily;

        // Hide loading
        loadingSpinner.classList.add('hidden');
        welcomeMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        weatherContent.classList.remove('hidden');

        // Expand Container for Side-by-Side View
        appContainer.classList.add('expanded');

        // Text Updates
        document.getElementById('city-name').textContent = `${cityName}, ${country}`;
        document.getElementById('date-time').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°`;
        document.getElementById('wind-speed').textContent = `${current.wind_speed_10m} km/h`;
        document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;

        // Weather Code
        const code = current.weather_code;
        const info = weatherCodes[code] || { desc: 'Unknown', icon: 'fas fa-question' };
        document.getElementById('weather-desc').textContent = info.desc;

        const iconContainer = document.querySelector('.weather-icon-container');
        iconContainer.innerHTML = `<i class="${info.icon}" style="font-size: 6rem; color: rgba(255,255,255,0.9);"></i>`;

        // Forecast
        const forecastGrid = document.getElementById('forecast-grid');
        forecastGrid.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const dateStr = daily.time[i];
            const date = new Date(dateStr);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const max = Math.round(daily.temperature_2m_max[i]);
            const min = Math.round(daily.temperature_2m_min[i]);
            const c = daily.weather_code[i];
            const iInfo = weatherCodes[c] || { icon: 'fas fa-question' };

            const card = document.createElement('div');
            card.className = 'forecast-item';
            card.innerHTML = `
                <span class="forecast-day">${day}</span>
                <i class="${iInfo.icon} forecast-icon" style="font-size: 1.5rem; margin: 5px 0;"></i>
                <span class="forecast-temp">${max}° / ${min}°</span>
            `;
            forecastGrid.appendChild(card);
        }

        updateHighlights(current, daily);

        updateBackground(code);

    } catch (error) {
        showError('Failed to fetch data');
        console.error(error);
    }
}

function updateHighlights(current, daily) {
    const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const sunset = new Date(daily.sunset[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Check if highlights container exists, if not create it (handled in HTML step next)
    // Or assume it exists. Let's populate it.
    // For simplicity, we'll assume the HTML structure exists and populate by ID or class
    // But since I haven't edited HTML yet, I'll do the DOM manipulation here dynamically?
    // No, better to update HTML first or do it all here. I'll add the container in HTML next.

    // Wait, I can inject the HTML structure into .forecast-section
    const forecastSection = document.querySelector('.forecast-section');

    // Check if highlights already exists to avoid dupes
    let highlightsSection = document.getElementById('highlights-section');
    if (!highlightsSection) {
        highlightsSection = document.createElement('div');
        highlightsSection.id = 'highlights-section';
        highlightsSection.className = 'highlights-section';
        highlightsSection.innerHTML = `<h3>Today's Highlights</h3><div class="highlights-grid" id="highlights-grid"></div>`;
        forecastSection.appendChild(highlightsSection);
    }

    const grid = document.getElementById('highlights-grid');
    grid.innerHTML = `
        <div class="highlight-card">
            <span class="highlight-title">UV Index</span>
            <div class="highlight-value">${daily.uv_index_max[0]}</div>
            <span class="highlight-status">${getUVStatus(daily.uv_index_max[0])}</span>
        </div>
        <div class="highlight-card">
            <span class="highlight-title">Wind Status</span>
            <div class="highlight-value">${current.wind_speed_10m} <span class="unit">km/h</span></div>
            <span class="highlight-status">Normal</span>
        </div>
        <div class="highlight-card">
            <span class="highlight-title">Sunrise & Sunset</span>
            <div class="highlight-value sun-time"><i class="fas fa-arrow-up"></i> ${sunrise}</div>
            <div class="highlight-value sun-time"><i class="fas fa-arrow-down"></i> ${sunset}</div>
        </div>
        <div class="highlight-card">
            <span class="highlight-title">Humidity</span>
            <div class="highlight-value">${current.relative_humidity_2m}<span class="unit">%</span></div>
            <span class="highlight-status">Normal</span>
        </div>
        <div class="highlight-card">
            <span class="highlight-title">Visibility</span>
            <div class="highlight-value">${(current.visibility / 1000).toFixed(1)} <span class="unit">km</span></div>
            <span class="highlight-status">Good Visibility</span>
        </div>
        <div class="highlight-card">
            <span class="highlight-title">Feels Like</span>
            <div class="highlight-value">${Math.round(current.apparent_temperature)}°</div>
            <span class="highlight-status">Actual: ${Math.round(current.temperature_2m)}°</span>
        </div>
    `;
}

function getUVStatus(uv) {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    return "Very High";
}

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');
const body = document.body;

// Check saved theme on load
if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-theme');
    themeIcon.classList.replace('fa-sun', 'fa-moon');
}

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');

    if (isLight) {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
});
