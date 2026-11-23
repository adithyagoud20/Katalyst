import type { ProtocolScenario } from "@/lib/protocols/schema";

export const tcpHandshakeScenario: ProtocolScenario = {
  id: "tcp-handshake",
  title: "TCP 3-Way Handshake & Graceful Teardown",
  category: "transport",
  summary: "Establish a reliable stream with sequence number synchronization (SYN -> SYN-ACK -> ACK), payload exchange, and 4-way FIN termination.",
  osiLayer: 4,
  overviewDescription: "TCP is the connection-oriented transport protocol providing reliable, ordered, and error-checked delivery of byte streams between hosts. It uses a 3-way handshake (SYN, SYN-ACK, ACK) to synchronize sequence numbers before data transfer.",
  defaultPort: "Various (per service)",
  transportType: "IP (Protocol 6)",
  dataFormat: "Binary (Segments with 20-60B headers)",
  commonMethods: "SYN, ACK, PSH, FIN, RST",
  rfc: "RFC 793 / RFC 9293",
  nodes: [
    {
      id: "client",
      label: "Client Browser",
      type: "client",
      ip: "192.168.1.105",
      mac: "00:1a:2b:3c:4d:5e",
      xPercent: 15,
      yPercent: 50,
    },
    {
      id: "router",
      label: "Edge Router / NAT",
      type: "router",
      ip: "192.168.1.1",
      mac: "52:54:00:12:34:56",
      xPercent: 50,
      yPercent: 50,
    },
    {
      id: "server",
      label: "Web Server (katalyst.dev)",
      type: "server",
      ip: "76.76.21.21",
      mac: "00:50:56:fe:dc:ba",
      xPercent: 85,
      yPercent: 50,
    },
  ],
  wires: [
    { id: "wire-c-r", fromNodeId: "client", toNodeId: "router", label: "Local LAN" },
    { id: "wire-r-s", fromNodeId: "router", toNodeId: "server", label: "WAN / Internet" },
  ],
  steps: [
    {
      stepIndex: 0,
      timeMs: 0,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "TCP",
      arrowLabel: "SYN [Seq=0, Win=65535, MSS=1460]",
      summary: "Step 1 of 3-Way Handshake: Client sends SYN packet with Initial Sequence Number (ISN=0) and MSS option to initiate connection to server port 80.",
      status: "normal",
      // Eth (14) + IP (20) + TCP (32 with options) = 66 bytes
      rawHex: "005056fedcba001a2b3c4d5e0800450000421a2b4000400684f5c0a801694c4c1515c412005000000000000000008002ffffa12b0000020405b40103030801010402",
      layers: [
        {
          name: "Ethernet II",
          layer: "data-link",
          fields: [
            { name: "Destination MAC", value: "00:50:56:fe:dc:ba", byteRange: [0, 6], description: "Target server MAC address" },
            { name: "Source MAC", value: "00:1a:2b:3c:4d:5e", byteRange: [6, 12], description: "Client NIC MAC address" },
            { name: "EtherType", value: "0x0800 (IPv4)", byteRange: [12, 14], description: "IPv4 payload protocol" },
          ],
        },
        {
          name: "Internet Protocol Version 4",
          layer: "network",
          fields: [
            { name: "Source IP", value: "192.168.1.105", byteRange: [26, 30], description: "Origin client IP" },
            { name: "Destination IP", value: "76.76.21.21", byteRange: [30, 34], description: "Destination web server IP" },
            { name: "Protocol", value: "6 (TCP)", byteRange: [23, 24], description: "Transport Protocol: TCP" },
          ],
        },
        {
          name: "Transmission Control Protocol (SYN)",
          layer: "transport",
          fields: [
            { name: "Source Port", value: "50194", byteRange: [34, 36], description: "Client ephemeral port" },
            { name: "Destination Port", value: "80 (HTTP)", byteRange: [36, 38], description: "Server HTTP service listening port" },
            { name: "Sequence Number", value: "0 (Relative ISN)", byteRange: [38, 42], description: "Initial Sequence Number chosen by client", katContext: "In TCP, both endpoints select an independent Initial Sequence Number (ISN) to prevent collision with old packets from previous connections." },
            { name: "Acknowledgment Number", value: "0", byteRange: [42, 46], description: "Not set because ACK flag is 0" },
            { name: "Flags", value: "0x002 (SYN)", byteRange: [46, 48], description: "SYN flag requests connection synchronization" },
            { name: "Window Size", value: "65535 bytes", byteRange: [48, 50], description: "Client receive window buffer capacity" },
            { name: "TCP Options", value: "MSS=1460, WS=8, SACK=Permitted", byteRange: [54, 66], description: "Maximum Segment Size and window scaling options" },
          ],
        },
      ],
    },
    {
      stepIndex: 1,
      timeMs: 18,
      fromNodeId: "server",
      toNodeId: "client",
      protocolName: "TCP",
      arrowLabel: "SYN-ACK [Seq=0, Ack=1, Win=65535]",
      summary: "Step 2 of 3-Way Handshake: Server replies with SYN-ACK, acknowledging client SYN (Ack=1) and offering its own Initial Sequence Number (ISN=0).",
      status: "normal",
      rawHex: "001a2b3c4d5e005056fedcba0800450000422b3c40003f0674064c4c1515c0a801690050c41200000000000000018012ffffb23c0000020405b40103030801010402",
      layers: [
        {
          name: "Transmission Control Protocol (SYN-ACK)",
          layer: "transport",
          fields: [
            { name: "Source Port", value: "80 (HTTP)", byteRange: [34, 36], description: "Server HTTP port" },
            { name: "Destination Port", value: "50194", byteRange: [36, 38], description: "Client ephemeral port" },
            { name: "Sequence Number", value: "0 (Server ISN)", byteRange: [38, 42], description: "Server Initial Sequence Number" },
            { name: "Acknowledgment Number", value: "1 (Client ISN + 1)", byteRange: [42, 46], description: "Acknowledges receipt of client SYN by consuming 1 sequence number" },
            { name: "Flags", value: "0x012 (SYN, ACK)", byteRange: [46, 48], description: "Both SYN and ACK flags are set simultaneously" },
            { name: "Window Size", value: "65535 bytes", byteRange: [48, 50], description: "Server receive window buffer" },
          ],
        },
      ],
    },
    {
      stepIndex: 2,
      timeMs: 36,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "TCP",
      arrowLabel: "ACK [Seq=1, Ack=1, Win=65535]",
      summary: "Step 3 of 3-Way Handshake: Client acknowledges server SYN (Ack=1). Connection enters ESTABLISHED state. Ready for payload transmission.",
      status: "normal",
      rawHex: "005056fedcba001a2b3c4d5e0800450000343c4d4000400662d3c0a801694c4c1515c412005000000001000000018010ffff91200000",
      layers: [
        {
          name: "Transmission Control Protocol (ACK)",
          layer: "transport",
          fields: [
            { name: "Sequence Number", value: "1", byteRange: [38, 42], description: "Next byte client will transmit" },
            { name: "Acknowledgment Number", value: "1", byteRange: [42, 46], description: "Acknowledges server SYN" },
            { name: "Flags", value: "0x010 (ACK)", byteRange: [46, 48], description: "ACK flag confirms connection is established" },
            { name: "Connection State", value: "ESTABLISHED", byteRange: [46, 48], description: "Both sockets are now in ESTABLISHED state" },
          ],
        },
      ],
    },
    {
      stepIndex: 3,
      timeMs: 40,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "TCP",
      arrowLabel: "PSH-ACK [Seq=1, Ack=1, Len=48 (HTTP GET)]",
      summary: "Client transmits application payload: HTTP GET / request (48 bytes) with PSH flag requesting immediate delivery to web server process.",
      status: "normal",
      // Eth (14) + IP (20) + TCP (20) + Data (48) = 102 bytes
      // "GET / HTTP/1.1\r\nHost: katalyst.dev\r\nConnection: close\r\n\r\n"
      rawHex: "005056fedcba001a2b3c4d5e0800450000664d5e4000400651a2c0a801694c4c1515c412005000000001000000018018ffff31820000474554202f20485454502f312e310d0a486f73743a206b6174616c7973742e6465760d0a436f6e6e656374696f6e3a20636c6f73650d0a0d0a",
      layers: [
        {
          name: "Transmission Control Protocol (Data)",
          layer: "transport",
          fields: [
            { name: "Sequence Number", value: "1", byteRange: [38, 42], description: "First byte of HTTP request" },
            { name: "Flags", value: "0x018 (PSH, ACK)", byteRange: [46, 48], description: "PSH forces immediate push to server application buffer" },
            { name: "Payload Length", value: "48 bytes", byteRange: [54, 102], description: "Carries ASCII HTTP GET request" },
          ],
        },
        {
          name: "Hypertext Transfer Protocol",
          layer: "application",
          fields: [
            { name: "Request Method", value: "GET / HTTP/1.1", byteRange: [54, 68], description: "HTTP Request Line" },
            { name: "Host Header", value: "katalyst.dev", byteRange: [70, 89], description: "Virtual host header" },
          ],
        },
      ],
    },
    {
      stepIndex: 4,
      timeMs: 65,
      fromNodeId: "server",
      toNodeId: "client",
      protocolName: "TCP",
      arrowLabel: "FIN-ACK [Seq=1, Ack=49]",
      summary: "Server finishes sending response and begins 4-way teardown by transmitting FIN-ACK (acknowledging 48 bytes of client data + 1).",
      status: "normal",
      rawHex: "001a2b3c4d5e005056fedcba0800450000345e6f40003f06419fc0a801694c4c15150050c41200000001000000318011ffffa4100000",
      layers: [
        {
          name: "Transmission Control Protocol (FIN-ACK)",
          layer: "transport",
          fields: [
            { name: "Acknowledgment Number", value: "49 (1 + 48 bytes)", byteRange: [42, 46], description: "Acknowledges all 48 bytes of client HTTP GET payload" },
            { name: "Flags", value: "0x011 (FIN, ACK)", byteRange: [46, 48], description: "FIN flag signals server has no more data to send" },
            { name: "Teardown State", value: "CLOSE_WAIT / FIN_WAIT_1", byteRange: [46, 48], description: "Initiates half-closed connection teardown" },
          ],
        },
      ],
    },
    {
      stepIndex: 5,
      timeMs: 70,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "TCP",
      arrowLabel: "ACK [Seq=49, Ack=2] (Connection Closed)",
      summary: "Client acknowledges server FIN. Client enters TIME_WAIT state to ensure duplicate packets dissipate before port can be safely reused.",
      status: "normal",
      rawHex: "005056fedcba001a2b3c4d5e0800450000346f70400040063080c0a801694c4c1515c412005000000031000000028010ffff90100000",
      layers: [
        {
          name: "Transmission Control Protocol (ACK)",
          layer: "transport",
          fields: [
            { name: "Sequence Number", value: "49", byteRange: [38, 42], description: "Final sequence number" },
            { name: "Acknowledgment Number", value: "2", byteRange: [42, 46], description: "Acknowledges server FIN" },
            { name: "Flags", value: "0x010 (ACK)", byteRange: [46, 48], description: "Final ACK" },
            { name: "Socket State", value: "TIME_WAIT (2*MSL)", byteRange: [46, 48], description: "Client socket waits 2*Maximum Segment Lifetime (typically 60s) before terminating" },
          ],
        },
      ],
    },
  ],
  chaosVariants: [
    {
      id: "drop-syn",
      name: "Dropped SYN & Exponential Backoff",
      description: "Drop the initial SYN packet to watch TCP SYN retransmission timer and exponential backoff.",
      triggerStepIndex: 0,
      action: "drop_packet",
      alternateSteps: [
        {
          stepIndex: 0,
          timeMs: 0,
          fromNodeId: "client",
          toNodeId: "server",
          protocolName: "TCP",
          arrowLabel: "SYN [Seq=0] (DROPPED BY FIREWALL)",
          summary: "Initial SYN is silently discarded by an upstream firewall. Client SYN-SENT timer begins.",
          status: "dropped",
          rawHex: "005056fedcba001a2b3c4d5e0800450000421a2b4000400684f5c0a801694c4c1515c412005000000000000000008002ffffa12b0000020405b40103030801010402",
          layers: [
            {
              name: "TCP State",
              layer: "transport",
              fields: [
                { name: "Client Socket State", value: "SYN_SENT (Timer: 1000ms)", byteRange: [46, 48], description: "Client awaits SYN-ACK; timer set to initial RTO (1s)" },
              ],
            },
          ],
        },
        {
          stepIndex: 1,
          timeMs: 1000,
          fromNodeId: "client",
          toNodeId: "server",
          protocolName: "TCP",
          arrowLabel: "Retransmitted SYN [Seq=0, Attempt #1]",
          summary: "TCP Retransmission Timer fires at 1000ms. Client automatically retransmits the SYN with duplicate Seq=0.",
          status: "retransmission",
          rawHex: "005056fedcba001a2b3c4d5e0800450000421a2c4000400684f4c0a801694c4c1515c412005000000000000000008002ffffa12a0000020405b40103030801010402",
          layers: [
            {
              name: "TCP Retransmission",
              layer: "transport",
              fields: [
                { name: "Retransmission Type", value: "RTO Timeout (1s)", byteRange: [46, 48], description: "Exponential backoff doubles next RTO to 2s" },
              ],
            },
          ],
        },
      ],
    },
  ],
  examChallenge: {
    id: "tcp-handshake-order",
    title: "Construct the TCP 3-Way Handshake",
    prompt: "A client wants to connect to port 80 of a web server. Sequence the first 3 packets to correctly establish the TCP socket.",
    shuffledStepIds: [2, 0, 1],
    correctSequence: [0, 1, 2],
    hints: [
      "SYN must always be the first packet sent by the active opener.",
      "The server must acknowledge the client's SYN and send its own SYN at the same time.",
      "The connection is only ESTABLISHED once the client acknowledges the server's SYN.",
    ],
    explanation: "The TCP 3-Way Handshake strictly follows: 1) Client sends SYN, 2) Server responds with SYN-ACK, 3) Client sends final ACK.",
  },
  codeSnippetBridge: {
    language: "c",
    title: "C TCP Client Socket Handshake",
    code: `// Low-level POSIX TCP client socket connection
#include <stdio.h>
#include <string.h>

int main() {
    printf("Creating socket: socket(AF_INET, SOCK_STREAM, 0)\\n");
    printf("Preparing sockaddr_in for port 80 (76.76.21.21)\\n");
    printf("Executing connect(): triggers TCP 3-way handshake!\\n");
    printf("Connection status: ESTABLISHED\\n");
    return 0;
}
`,
  },
};
