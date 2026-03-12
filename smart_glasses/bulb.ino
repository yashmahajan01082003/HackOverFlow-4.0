#include <WiFi.h>

const char* ssid = "Winter";
const char* password = "87654321";

int relayPin = 23;   // GPIO23 on ESP32

WiFiServer server(80);

bool relayState = false;

void setup()
{
  Serial.begin(115200);

  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH);   // relay OFF

  WiFi.begin(ssid, password);

  Serial.print("Connecting");

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  server.begin();
}

void loop()
{
  WiFiClient client = server.available();

  if (client)
  {
    String request = client.readStringUntil('\r');
    client.flush();

    if (request.indexOf("/toggle") != -1)
    {
      relayState = !relayState;
      digitalWrite(relayPin, relayState ? LOW : HIGH);
      Serial.println("Relay toggled");
    }

    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println();
    client.println("Relay OK");

    client.stop();
  }
}