import type { ProtocolScenario } from "@/lib/protocols/schema";

export const mqttTelemetryScenario: ProtocolScenario = {
  id: "mqtt-telemetry",
  title: "MQTT 3.1.1 IoT Telemetry & QoS Flow (OASIS)",
  category: "transport",
  summary: "Explore lightweight publish/subscribe messaging for constrained IoT devices: 2-byte fixed headers, Clean Session negotiation, QoS 1 delivery guarantees, and DUP retransmissions.",
  osiLayer: 7,
  overviewDescription: "MQTT is an OASIS standard lightweight publish/subscribe messaging protocol designed for constrained IoT devices and low-bandwidth, high-latency networks. It supports 3 Quality of Service (QoS) levels to guarantee message delivery.",
  defaultPort: "1883 (8883 for TLS)",
  transportType: "TCP",
  dataFormat: "Binary (2-byte fixed header + payload)",
  commonMethods: "CONNECT, PUBLISH, PUBACK, SUBSCRIBE",
  rfc: "OASIS MQTT v3.1.1",
  nodes: [
    {
      id: "client",
      label: "ESP32 Wi-Fi Node",
      type: "client",
      ip: "192.168.1.77",
      mac: "30:ae:a4:89:12:cd",
      xPercent: 18,
      yPercent: 50,
    },
    {
      id: "broker",
      label: "Mosquitto MQTT Broker",
      type: "server",
      ip: "192.168.1.1",
      mac: "00:50:56:fe:dc:ba",
      xPercent: 82,
      yPercent: 50,
    },
  ],
  wires: [
    { id: "wire-esp-broker", fromNodeId: "client", toNodeId: "broker", label: "TCP Port 1883" },
  ],
  steps: [
    {
      stepIndex: 0,
      timeMs: 0,
      fromNodeId: "client",
      toNodeId: "broker",
      protocolName: "MQTT",
      arrowLabel: "CONNECT [ClientID: esp32-node-01, CleanSession=1, KeepAlive=60s]",
      summary: "ESP32 initiates MQTT session over established TCP socket, requesting Clean Session flag with 60-second keepalive ping interval.",
      status: "normal",
      rawHex: "005056fedcba30aea48912cd08004500004f1a2b4000400684f5c0a8014dc0a80101cbac075b00000001000000018018ffff12340000101900044d5154540402003c000d65737033322d6e6f64652d3031",
      layers: [
        {
          name: "Ethernet II",
          layer: "data-link",
          fields: [
            { name: "Destination MAC", value: "00:50:56:fe:dc:ba", byteRange: [0, 6], description: "Local gateway / broker interface MAC" },
            { name: "Source MAC", value: "30:ae:a4:89:12:cd", byteRange: [6, 12], description: "ESP32 Wi-Fi MAC address" },
          ],
        },
        {
          name: "Transmission Control Protocol (TCP)",
          layer: "transport",
          fields: [
            { name: "Source Port", value: "52140", byteRange: [34, 36], description: "Client ephemeral TCP port" },
            { name: "Destination Port", value: "1883 (MQTT Standard)", byteRange: [36, 38], description: "Standard unencrypted MQTT listener port (8883 is MQTT over TLS)" },
          ],
        },
        {
          name: "MQTT Control Packet (CONNECT)",
          layer: "application",
          fields: [
            { name: "Control Packet Type", value: "1 (CONNECT)", byteRange: [54, 55], description: "Upper nibble 0x10 identifies CONNECT packet" },
            { name: "Remaining Length", value: "25 bytes", byteRange: [55, 56], description: "Variable length encoding of remaining packet size" },
            { name: "Protocol Name", value: "MQTT", byteRange: [58, 62], description: "Protocol identifier string (RFC/OASIS standard)" },
            { name: "Protocol Level", value: "4 (v3.1.1)", byteRange: [62, 63], description: "0x04 corresponds to MQTT version 3.1.1 (0x05 is MQTT 5.0)" },
            { name: "Connect Flags", value: "0x02 (CleanSession=1)", byteRange: [63, 64], description: "CleanSession discards prior state and subscriptions on connect", katContext: "When CleanSession is 1, the broker will not store subscriptions or unacknowledged QoS 1/2 messages after disconnect, saving precious SRAM on constrained IoT devices." },
            { name: "Keep Alive", value: "60 seconds", byteRange: [64, 66], description: "Maximum inactivity window before PINGREQ must be sent" },
            { name: "Client Identifier", value: "esp32-node-01", byteRange: [68, 81], description: "UTF-8 unique identifier for this client" },
          ],
        },
      ],
    },
    {
      stepIndex: 1,
      timeMs: 15,
      fromNodeId: "broker",
      toNodeId: "client",
      protocolName: "MQTT",
      arrowLabel: "CONNACK [SessionPresent=0, ReturnCode=0 (Accepted)]",
      summary: "Mosquitto broker accepts connection request and confirms zero prior session state retained.",
      status: "normal",
      rawHex: "30aea48912cd005056fedcba08004500002c2b3c400040067406c0a80101c0a8014d075bcbac000000010000001c8018ffff5412000020020000",
      layers: [
        {
          name: "MQTT Control Packet (CONNACK)",
          layer: "application",
          fields: [
            { name: "Packet Type", value: "2 (CONNACK)", byteRange: [54, 55], description: "Broker acknowledgement of CONNECT request" },
            { name: "Remaining Length", value: "2 bytes", byteRange: [55, 56], description: "Fixed 2-byte variable header" },
            { name: "Session Present", value: "0", byteRange: [56, 57], description: "Confirms clean session established" },
            { name: "Return Code", value: "0x00 (Connection Accepted)", byteRange: [57, 58], description: "0x00 indicates successful authorization and connection" },
          ],
        },
      ],
    },
    {
      stepIndex: 2,
      timeMs: 25,
      fromNodeId: "client",
      toNodeId: "broker",
      protocolName: "MQTT",
      arrowLabel: "SUBSCRIBE [PacketID=1, Topic: sensors/esp32/commands, QoS=1]",
      summary: "ESP32 subscribes to incoming commands with QoS 1 (at least once delivery guarantee).",
      status: "normal",
      rawHex: "005056fedcba30aea48912cd0800450000551a2c4000400684efc0a8014dc0a80101cbac075b0000001c000000058018ffff12340000821d0001001673656e736f72732f65737033322f636f6d6d616e647301",
      layers: [
        {
          name: "MQTT Control Packet (SUBSCRIBE)",
          layer: "application",
          fields: [
            { name: "Packet Type & Flags", value: "0x82 (SUBSCRIBE, Reserved Bits)", byteRange: [54, 55], description: "Spec requires bit 1 to be set in SUBSCRIBE header" },
            { name: "Packet Identifier", value: "1", byteRange: [56, 58], description: "Tracks acknowledgement matching for QoS > 0" },
            { name: "Topic Filter", value: "sensors/esp32/commands", byteRange: [60, 82], description: "Hierarchical topic path matching command dispatches" },
            { name: "Requested QoS", value: "QoS 1 (At least once)", byteRange: [82, 83], description: "Guarantees command delivery with acknowledgment" },
          ],
        },
      ],
    },
    {
      stepIndex: 3,
      timeMs: 35,
      fromNodeId: "broker",
      toNodeId: "client",
      protocolName: "MQTT",
      arrowLabel: "SUBACK [PacketID=1, GrantedQoS=1]",
      summary: "Broker confirms subscription registration and grants QoS 1.",
      status: "normal",
      rawHex: "30aea48912cd005056fedcba08004500002d2b3d400040067405c0a80101c0a8014d075bcbac000000050000003b8018ffff541200009003000101",
      layers: [
        {
          name: "MQTT Control Packet (SUBACK)",
          layer: "application",
          fields: [
            { name: "Packet Type", value: "9 (SUBACK)", byteRange: [54, 55], description: "Subscription acknowledgement packet" },
            { name: "Packet Identifier", value: "1", byteRange: [56, 58], description: "Matches client SUBSCRIBE Packet ID" },
            { name: "Granted QoS", value: "0x01 (Success QoS 1)", byteRange: [58, 59], description: "Broker confirmed QoS level" },
          ],
        },
      ],
    },
    {
      stepIndex: 4,
      timeMs: 50,
      fromNodeId: "client",
      toNodeId: "broker",
      protocolName: "MQTT",
      arrowLabel: "PUBLISH [Topic: sensors/esp32/telemetry, QoS=1, PacketID=2, Payload: {\"temp\":24.5}]",
      summary: "ESP32 publishes temperature telemetry JSON payload to topic with QoS 1 at 2-byte header efficiency.",
      status: "normal",
      rawHex: "005056fedcba30aea48912cd0800450000601a2d4000400684e4c0a8014dc0a80101cbac075b0000003b000000088018ffff123400003228001773656e736f72732f65737033322f74656c656d6574727900027b2274656d70223a32342e357d",
      layers: [
        {
          name: "MQTT Control Packet (PUBLISH)",
          layer: "application",
          fields: [
            { name: "Flags", value: "0x32 (DUP=0, QoS=1, Retain=0)", byteRange: [54, 55], description: "First transmission of QoS 1 message without retain" },
            { name: "Topic Name", value: "sensors/esp32/telemetry", byteRange: [58, 81], description: "Target topic string" },
            { name: "Packet Identifier", value: "2", byteRange: [81, 83], description: "Identifier used to correlate PUBACK" },
            { name: "Payload (JSON)", value: "{\"temp\":24.5}", byteRange: [83, 96], description: "Serialized sensor readings sent across wire" },
          ],
        },
      ],
    },
    {
      stepIndex: 5,
      timeMs: 65,
      fromNodeId: "broker",
      toNodeId: "client",
      protocolName: "MQTT",
      arrowLabel: "PUBACK [PacketID=2]",
      summary: "Broker confirms receipt of published telemetry message, releasing QoS 1 state on both client and broker.",
      status: "normal",
      rawHex: "30aea48912cd005056fedcba08004500002c2b3e400040067404c0a80101c0a8014d075bcbac00000008000000658018ffff5412000040020002",
      layers: [
        {
          name: "MQTT Control Packet (PUBACK)",
          layer: "application",
          fields: [
            { name: "Packet Type", value: "4 (PUBACK)", byteRange: [54, 55], description: "QoS 1 publish acknowledgement" },
            { name: "Packet Identifier", value: "2", byteRange: [56, 58], description: "Confirms message with Packet ID 2 received" },
          ],
        },
      ],
    },
  ],
  chaosVariants: [
    {
      id: "dup-retransmit",
      name: "QoS 1 PUBACK Drop & Duplicate Retransmit (DUP=1)",
      description: "Simulate dropping PUBACK from the broker. The ESP32 retransmission timer fires, resending the PUBLISH frame with DUP flag set to 1.",
      triggerStepIndex: 4,
      action: "drop_packet",
      alternateSteps: [
        {
          stepIndex: 4,
          timeMs: 50,
          fromNodeId: "client",
          toNodeId: "broker",
          protocolName: "MQTT",
          arrowLabel: "PUBLISH [sensors/esp32/telemetry] (PUBACK Dropped)",
          summary: "Broker receives telemetry, but PUBACK packet is dropped by Wi-Fi congestion.",
          status: "dropped",
          rawHex: "005056fedcba30aea48912cd0800450000601a2d4000400684e4c0a8014dc0a80101cbac075b0000003b000000088018ffff123400003228001773656e736f72732f65737033322f74656c656d6574727900027b2274656d70223a32342e357d",
          layers: [
            {
              name: "MQTT Retransmit Timer",
              layer: "transport",
              fields: [
                { name: "Status", value: "PUBACK Timeout Expired", byteRange: [54, 55], description: "No PUBACK received within timeout period" },
              ],
            },
          ],
        },
        {
          stepIndex: 5,
          timeMs: 120,
          fromNodeId: "client",
          toNodeId: "broker",
          protocolName: "MQTT",
          arrowLabel: "PUBLISH [DUP=1, QoS=1, PacketID=2] (Retransmission)",
          summary: "ESP32 resends telemetry with DUP bit 3 set (0x3a instead of 0x32) using identical Packet ID 2.",
          status: "retransmission",
          rawHex: "005056fedcba30aea48912cd0800450000601a2e4000400684e3c0a8014dc0a80101cbac075b0000003b000000088018ffff123400003a28001773656e736f72732f65737033322f74656c656d6574727900027b2274656d70223a32342e357d",
          layers: [
            {
              name: "MQTT Control Packet (PUBLISH DUP)",
              layer: "application",
              fields: [
                { name: "Flags", value: "0x3a (DUP=1, QoS=1)", byteRange: [54, 55], description: "DUP bit informs broker this message has been previously sent" },
                { name: "Packet Identifier", value: "2", byteRange: [81, 83], description: "Broker matches Packet ID 2 and suppresses duplicate application dispatch" },
              ],
            },
          ],
        },
      ],
    },
  ],
  examChallenge: {
    id: "mqtt-order-challenge",
    title: "MQTT 3.1.1 Session & Pub/Sub Sequencing",
    prompt: "Reconstruct the complete MQTT protocol handshake, topic subscription, and QoS 1 telemetry publishing lifecycle.",
    shuffledStepIds: [2, 0, 4, 1, 5, 3],
    correctSequence: [0, 1, 2, 3, 4, 5],
    hints: [
      "The client must establish a session with CONNECT before subscribing or publishing.",
      "The broker confirms session parameters with CONNACK.",
      "The client registers topic subscriptions with SUBSCRIBE and waits for SUBACK.",
      "Telemetry is published with PUBLISH, and acknowledged by the broker with PUBACK.",
    ],
    explanation: "MQTT Lifecycle: 1) CONNECT, 2) CONNACK, 3) SUBSCRIBE, 4) SUBACK, 5) PUBLISH (QoS 1), 6) PUBACK.",
  },
  codeSnippetBridge: {
    language: "c",
    title: "ESP32 Arduino MQTT Client (PubSubClient)",
    code: `// ESP32 MQTT Telemetry Publisher
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "WIFI_SSID";
const char* password = "WIFI_PASSWORD";
const char* mqtt_server = "192.168.1.1";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    // CONNECT with CleanSession=1
    if (client.connect("esp32-node-01")) {
      // SUBSCRIBE to command topic
      client.subscribe("sensors/esp32/commands", 1);
    }
  }
  client.loop();
  
  // PUBLISH telemetry JSON payload
  const char* payload = "{\\"temp\\":24.5}";
  client.publish("sensors/esp32/telemetry", payload, false);
  delay(5000);
}
`,
  },
};
