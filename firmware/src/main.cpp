#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASS ""

IPAddress serverIp(5, 255, 123, 12);
const int serverPort = 80;
const char* hostname = "fd6f4e616d9a98ee-41-59-23-84.serveousercontent.com";
const char* apiPath = "/api/v1/sensor/ingest";

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define DHTPIN 15
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define POT_HEART 34
#define POT_SLEEP 35

WiFiClient client;

int cs(float t, int hr, int sl);
String cls(int s);
String rsk(int sl, int hr);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Wire.begin(21, 22);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("WiFi...");
  display.display();

  Serial.print("WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int a = 0;
  while (WiFi.status() != WL_CONNECTED && a < 100) { delay(500); Serial.print("."); a++; }

  display.clearDisplay();
  display.setCursor(0, 0);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK");
    display.println("WiFi OK");
    display.print("IP: "); display.println(WiFi.localIP());
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.print(" FAIL after "); Serial.print(a); Serial.println(" tries");
    display.println("WiFi FAIL");
  }
  display.display();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi down");
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    int a = 0;
    while (WiFi.status() != WL_CONNECTED && a < 60) { delay(500); a++; }
    if (WiFi.status() != WL_CONNECTED) {
      Serial.print("WiFi reconnect FAIL after "); Serial.print(a); Serial.println(" tries");
      delay(2000);
      return;
    }
    Serial.println("WiFi reconnected");
  }

  float t = dht.readTemperature();
  if (isnan(t)) t = 25.0;
  int hr = map(analogRead(POT_HEART), 0, 4095, 60, 130);
  int sl = map(analogRead(POT_SLEEP), 0, 4095, 0, 100);
  int ss = cs(t, hr, sl);

  String body = "{\"temperature\":" + String(t,1) + ",\"heartRate\":" + String(hr) +
                ",\"sleepScore\":" + String(sl) + ",\"stressScore\":" + String(ss) +
                ",\"currentStatus\":\"" + cls(ss) +
                "\",\"depressionRisk\":\"" + rsk(sl, hr) + "\"}";

  Serial.print("POST len="); Serial.println(body.length());
  Serial.print("Connecting to "); Serial.print(serverIp); Serial.print(":"); Serial.println(serverPort);
  int conn = client.connect(serverIp, serverPort, 15000);
  Serial.print("connect()="); Serial.println(conn);
  if (conn == 1) {
    Serial.println("Connected, sending request");
    client.print("POST "); client.print(apiPath); client.println(" HTTP/1.1");
    client.print("Host: "); client.println(hostname);
    client.print("Content-Type: application/json\r\n");
    client.print("Content-Length: "); client.println(body.length());
    client.println("Connection: close");
    client.println();
    client.print(body);
    unsigned long timeout = millis() + 10000;
    while (client.available() == 0 && millis() < timeout) { delay(10); }
    if (client.available() > 0) {
      String line = client.readStringUntil('\n');
      line.trim();
      bool ok = line.indexOf("200") >= 0;
      Serial.print("Status: "); Serial.println(line);
      client.stop();
      display.clearDisplay();
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.print("T:"); display.print(t,1); display.print(" HR:"); display.println(hr);
      display.print("Sleep:"); display.print(sl); display.print(" Stress:"); display.println(ss);
      display.print(cls(ss)); display.print(" "); display.println(rsk(sl, hr));
      display.setTextSize(2);
      display.setCursor(0, 48);
      display.print(ok ? "SENT" : "FAIL");
      display.display();
    } else {
      Serial.println("Response timeout");
      client.stop();
    }
  } else {
    Serial.println("connect FAIL (timeout)");
  }
  Serial.println(conn == 1 ? "POST OK" : "POST FAIL");
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("T:"); display.print(t,1); display.print(" HR:"); display.println(hr);
  display.print("Sleep:"); display.print(sl); display.print(" Stress:"); display.println(ss);
  display.print(cls(ss)); display.print(" "); display.println(rsk(sl, hr));
  display.setTextSize(2);
  display.setCursor(0, 48);
  display.print(conn == 1 ? "SENT" : "FAIL");
  display.display();

  delay(3000);
}

int cs(float t, int hr, int sl) {
  int s = 0;
  if (hr < 75) s += 10; else if (hr < 95) s += 30; else if (hr < 110) s += 50; else s += 70;
  if (t >= 24 && t <= 28) s += 5; else if (t > 28 && t <= 31) s += 15; else s += 25;
  if (sl >= 70) s -= 10; else if (sl >= 40) s += 10; else s += 25;
  return constrain(s, 0, 100);
}

String cls(int s) {
  if (s < 40) return "NORMAL/CALM";
  if (s < 70) return "MODERATE";
  return "STRESS";
}

String rsk(int sl, int hr) {
  int r = 0;
  if (sl < 40) r += 60; else if (sl < 70) r += 30; else r += 10;
  if (hr > 105) r += 25; else if (hr > 90) r += 10;
  return r >= 60 ? "HIGH RISK" : "LOW RISK";
}
