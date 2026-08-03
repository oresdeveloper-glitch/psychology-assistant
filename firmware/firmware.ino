#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

// --- Network Configuration ---
const char* ssid = "ESP32_Health_Test";
const char* password = "password123"; // Must be at least 8 characters


WebServer server(80);
MAX30105 particleSensor;

// --- Thermistor Configuration ---
const int thermistorPin = 34;
const float R_REF = 10000.0;           // 10k Ohm series resistor
const float NOMINAL_RESISTANCE = 10000.0; // Thermistor resistance at 25 degrees C
const float NOMINAL_TEMP = 25.0;
const float B_COEFFICIENT = 3950.0;    // Beta coefficient of the thermistor

// --- Heart Rate Variables ---
const byte RATE_SIZE = 4; // Increase for more averaging, decrease for faster response
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg = 0;

// --- Sensor Readings ---
float currentTempC = 0.0;
long irValue = 0;

// --- Web Page HTML/JS ---
// Stored in program memory to save RAM. Uses AJAX to fetch data smoothly.
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE HTML><html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ESP32 Health Monitor</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; margin-top: 40px; background: #f4f4f9; color: #333;}
    .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0px 4px 8px rgba(0,0,0,0.1); display: inline-block; margin: 10px; width: 220px;}
    h1 { color: #2c3e50; }
    h2 { margin: 10px 0 0 0; font-size: 2.5em; color: #e74c3c; }
    p { margin: 0; font-size: 1.2em; color: #7f8c8d; font-weight: bold;}
  </style>
</head>
<body>
  <h1>Sensor Dashboard</h1>
  <div class="card">
    <p>Heart Rate</p>
    <h2><span id="bpm">0</span> <span style="font-size:0.4em; color:#7f8c8d;">BPM</span></h2>
  </div>
  <div class="card">
    <p>Temperature</p>
    <h2><span id="temp">0.0</span> <span style="font-size:0.4em; color:#7f8c8d;">&deg;C</span></h2>
  </div>
  <div class="card">
    <p>Raw IR (Finger Detect)</p>
    <h2 style="color: #3498db;"><span id="ir">0</span></h2>
  </div>
  <script>
    setInterval(function() {
      fetch('/data')
        .then(response => response.json())
        .then(data => {
          document.getElementById('bpm').innerText = data.bpm;
          document.getElementById('temp').innerText = data.temp.toFixed(1);
          document.getElementById('ir').innerText = data.ir;
        });
    }, 1000); // Fetch new data every 1 second
  </script>
</body>
</html>
)rawliteral";

void setup() {
  Serial.begin(115200);

  // 1. Initialize Access Point
  Serial.println("\nStarting Access Point...");
  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("Connect to Wi-Fi network: ");
  Serial.println(ssid);
  Serial.print("Dashboard IP address: ");
  Serial.println(IP); // Usually 192.168.4.1

  // 2. Initialize Web Server Routing
  server.on("/", []() {
    server.send(200, "text/html", index_html);
  });
  
  server.on("/data", []() {
    String json = "{";
    json += "\"bpm\":" + String(beatAvg) + ",";
    json += "\"temp\":" + String(currentTempC) + ",";
    json += "\"ir\":" + String(irValue);
    json += "}";
    server.send(200, "application/json", json);
  });
  
  server.begin();
  Serial.println("HTTP server started.");

  // 3. Initialize I2C and MAX30102
  Wire.begin(21, 22); // SDA, SCL
  
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Check wiring/power.");
    while (1);
  }
  Serial.println("MAX30102 initialized.");
  
  particleSensor.setup(); // Configure sensor with default settings
  particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED on to indicate running
  particleSensor.setPulseAmplitudeGreen(0);  // Turn off Green LED
}

void loop() {
  server.handleClient(); // Keep the web server listening
  int adcValue = analogRead(thermistorPin);
  if (adcValue > 0) {
    // Convert ADC to voltage (ESP32 ADC is 12-bit, so 0-4095)
    float voltage = adcValue * (3.3 / 4095.0);
    // Calculate resistance
    float resistance = R_REF * ((3.3 / voltage) - 1.0);
    
    // Steinhart-Hart equation for temperature
    float steinhart = resistance / NOMINAL_RESISTANCE; 
    steinhart = log(steinhart);                  
    steinhart /= B_COEFFICIENT;                  
    steinhart += 1.0 / (NOMINAL_TEMP + 273.15);  
    steinhart = 1.0 / steinhart;                 
    currentTempC = steinhart - 273.15;           
  }

  // --- Read MAX30102 ---
  irValue = particleSensor.getIR();
  
  if (checkForBeat(irValue) == true) {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);
    
    // Filter out unrealistic BPMs
    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;
      
      // Calculate average
      beatAvg = 0;
      for (byte x = 0 ; x < RATE_SIZE ; x++) {
        beatAvg += rates[x];
      }
      beatAvg /= RATE_SIZE;
    }
  }

  // If no finger is detected, reset the BPM reading
  if (irValue < 50000) {
    beatAvg = 0;
  }

  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 1000) {
    lastPrint = millis();
    Serial.print("KHAIRATY:");
    Serial.print(currentTempC, 2);
    Serial.print(",");
    Serial.print(beatAvg);
    Serial.print(",");
    Serial.print(irValue);
    Serial.println();
  }
}
