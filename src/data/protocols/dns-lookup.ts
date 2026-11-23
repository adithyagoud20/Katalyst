import type { ProtocolScenario } from "@/lib/protocols/schema";

export const dnsLookupScenario: ProtocolScenario = {
  id: "dns-lookup",
  title: "DNS Resolution (UDP 53)",
  category: "resolution",
  summary: "Recursive DNS resolution of 'katalyst.dev' from client stub resolver through recursive and authoritative DNS nameservers.",
  osiLayer: 7,
  overviewDescription: "The Domain Name System translates human-readable hostnames into numeric IP addresses. A client stub resolver queries a recursive resolver over UDP port 53, which recursively traverses Root, TLD, and Authoritative nameservers to resolve records.",
  defaultPort: "53 (UDP / TCP)",
  transportType: "UDP / TCP",
  dataFormat: "Binary (DNS Message Format)",
  commonMethods: "Query (A, AAAA, CNAME, MX)",
  rfc: "RFC 1035",
  nodes: [
    {
      id: "client",
      label: "Client Stub Resolver",
      type: "client",
      ip: "192.168.1.105",
      mac: "00:1a:2b:3c:4d:5e",
      xPercent: 12,
      yPercent: 50,
    },
    {
      id: "resolver",
      label: "Recursive Resolver",
      type: "resolver",
      ip: "8.8.8.8",
      mac: "52:54:00:12:34:56",
      xPercent: 45,
      yPercent: 50,
    },
    {
      id: "root-dns",
      label: "Root Nameserver (a.root-servers.net)",
      type: "server",
      ip: "198.41.0.4",
      mac: "00:50:56:a1:b2:c3",
      xPercent: 82,
      yPercent: 24,
    },
    {
      id: "auth-dns",
      label: "Authoritative Nameserver (ns1.katalyst.dev)",
      type: "server",
      ip: "208.67.222.222",
      mac: "00:50:56:d4:e5:f6",
      xPercent: 82,
      yPercent: 76,
    },
  ],
  wires: [
    { id: "wire-c-r", fromNodeId: "client", toNodeId: "resolver", label: "Recursive Query" },
    { id: "wire-r-root", fromNodeId: "resolver", toNodeId: "root-dns", label: "Iterative Root Query" },
    { id: "wire-r-auth", fromNodeId: "resolver", toNodeId: "auth-dns", label: "Iterative Auth Query" },
  ],
  steps: [
    {
      stepIndex: 0,
      timeMs: 0,
      fromNodeId: "client",
      toNodeId: "resolver",
      protocolName: "DNS",
      arrowLabel: "Standard query 0x1a2b A katalyst.dev",
      summary: "Client issues standard recursive DNS query (Transaction ID: 0x1a2b) for record 'katalyst.dev' to configured resolver 8.8.8.8 over UDP port 53.",
      status: "normal",
      // Ethernet II (14B) + IPv4 (20B) + UDP (8B) + DNS (28B) = 70 Bytes total
      // Eth: 52 54 00 12 34 56 (dst mac) 00 1a 2b 3c 4d 5e (src mac) 08 00 (IPv4)
      // IP: 45 00 00 38 (len 56) 1c 2d 40 00 40 11 (UDP) 72 1a c0 a8 01 69 (192.168.1.105) 08 08 08 08 (8.8.8.8)
      // UDP: c4 12 (src 50194) 00 35 (dst 53) 00 24 (len 36) 81 2f
      // DNS: 1a 2b (ID) 01 00 (Flags: Std Query, RD=1) 00 01 (QDCOUNT 1) 00 00 00 00 00 00 08 6b 61 74 61 6c 79 73 74 03 64 65 76 00 00 01 00 01
      rawHex: "525400123456001a2b3c4d5e0800450000381c2d40004011721ac0a8016908080808c41200350024812f1a2b01000001000000000000086b6174616c797374036465760000010001",
      layers: [
        {
          name: "Ethernet II",
          layer: "data-link",
          fields: [
            { name: "Destination MAC", value: "52:54:00:12:34:56", byteRange: [0, 6], description: "Default gateway / Resolver network interface MAC address" },
            { name: "Source MAC", value: "00:1a:2b:3c:4d:5e", byteRange: [6, 12], description: "Client NIC hardware MAC address" },
            { name: "EtherType", value: "0x0800 (IPv4)", byteRange: [12, 14], description: "Encapsulated network layer protocol identifier" },
          ],
        },
        {
          name: "Internet Protocol Version 4",
          layer: "network",
          fields: [
            { name: "Source IP", value: "192.168.1.105", byteRange: [26, 30], description: "Client local IPv4 address" },
            { name: "Destination IP", value: "8.8.8.8", byteRange: [30, 34], description: "Target recursive DNS resolver IP address" },
            { name: "Protocol", value: "17 (UDP)", byteRange: [23, 24], description: "Specifies transport layer is User Datagram Protocol" },
            { name: "Time to Live", value: "64", byteRange: [22, 23], description: "Hop limit before packet is dropped" },
          ],
        },
        {
          name: "User Datagram Protocol",
          layer: "transport",
          fields: [
            { name: "Source Port", value: "50194", byteRange: [34, 36], description: "Ephemeral client UDP source port" },
            { name: "Destination Port", value: "53 (DNS)", byteRange: [36, 38], description: "Standard DNS service port" },
            { name: "Length", value: "36 bytes", byteRange: [38, 40], description: "Total length of UDP header and DNS payload" },
            { name: "Checksum", value: "0x812f", byteRange: [40, 42], description: "Error-checking checksum over UDP pseudo-header" },
          ],
        },
        {
          name: "Domain Name System (Query)",
          layer: "application",
          fields: [
            { name: "Transaction ID", value: "0x1a2b", byteRange: [42, 44], description: "16-bit identifier matched by client when response arrives", katContext: "The Transaction ID (0x1a2b) ensures the client matches asynchronous responses with the original request, preventing spoofing." },
            { name: "Flags", value: "0x0100 (Standard query, RD=1)", byteRange: [44, 46], description: "Recursion Desired flag is set to 1, asking resolver to resolve on client behalf" },
            { name: "Questions", value: "1", byteRange: [46, 48], description: "Number of query entries in this packet" },
            { name: "Query Name", value: "katalyst.dev", byteRange: [54, 68], description: "Domain query encoded in length-prefixed labels" },
            { name: "Query Type", value: "A (Host Address 0x0001)", byteRange: [68, 70], description: "Requesting IPv4 address" },
          ],
        },
      ],
    },
    {
      stepIndex: 1,
      timeMs: 12,
      fromNodeId: "resolver",
      toNodeId: "root-dns",
      protocolName: "DNS",
      arrowLabel: "Iterative query: Who handles .dev?",
      summary: "Recursive resolver checks cache (miss) and asks a Root nameserver for nameservers authoritative for the '.dev' TLD.",
      status: "normal",
      rawHex: "005056a1b2c35254001234560800450000382a1b400038118d3408080808c6290004d1000035002492102c4f00000001000000000000086b6174616c797374036465760000010001",
      layers: [
        {
          name: "Internet Protocol Version 4",
          layer: "network",
          fields: [
            { name: "Source IP", value: "8.8.8.8", byteRange: [26, 30], description: "Resolver IP" },
            { name: "Destination IP", value: "198.41.0.4", byteRange: [30, 34], description: "a.root-servers.net IP" },
          ],
        },
        {
          name: "Domain Name System (Query)",
          layer: "application",
          fields: [
            { name: "Transaction ID", value: "0x2c4f", byteRange: [42, 44], description: "Iterative query transaction identifier" },
            { name: "Flags", value: "0x0000 (Iterative, RD=0)", byteRange: [44, 46], description: "Recursion Desired is 0 because root servers do not recurse" },
            { name: "Query Name", value: "katalyst.dev", byteRange: [54, 68], description: "Target domain" },
          ],
        },
      ],
    },
    {
      stepIndex: 2,
      timeMs: 28,
      fromNodeId: "root-dns",
      toNodeId: "resolver",
      protocolName: "DNS",
      arrowLabel: "Root referral -> .dev TLD nameserver",
      summary: "Root server replies with a referral delegation pointing to .dev TLD registry servers.",
      status: "normal",
      rawHex: "525400123456005056a1b2c30800450000443b2c400036117c23c6290004080808080035d10000305a412c4f80000001000000010000086b6174616c797374036465760000010001c014000200010001518000040364657600",
      layers: [
        {
          name: "Domain Name System (Referral)",
          layer: "application",
          fields: [
            { name: "Transaction ID", value: "0x2c4f", byteRange: [42, 44], description: "Matches iterative query ID" },
            { name: "Flags", value: "0x8000 (Response, No Error)", byteRange: [44, 46], description: "Response bit set, authoritative bit clear" },
            { name: "Authority Records", value: "1 (TLD Referral)", byteRange: [48, 50], description: "Delegation to .dev registry nameserver" },
          ],
        },
      ],
    },
    {
      stepIndex: 3,
      timeMs: 45,
      fromNodeId: "resolver",
      toNodeId: "auth-dns",
      protocolName: "DNS",
      arrowLabel: "Query ns1.katalyst.dev for A record",
      summary: "Resolver follows referral and asks authoritative nameserver 'ns1.katalyst.dev' for the final A record.",
      status: "normal",
      rawHex: "005056d4e5f65254001234560800450000384a3c400038116b1208080808d043dedec5000035002473213a8e00000001000000000000086b6174616c797374036465760000010001",
      layers: [
        {
          name: "Internet Protocol Version 4",
          layer: "network",
          fields: [
            { name: "Source IP", value: "8.8.8.8", byteRange: [26, 30], description: "Resolver IP" },
            { name: "Destination IP", value: "208.67.222.222", byteRange: [30, 34], description: "Authoritative nameserver IP" },
          ],
        },
        {
          name: "Domain Name System (Query)",
          layer: "application",
          fields: [
            { name: "Transaction ID", value: "0x3a8e", byteRange: [42, 44], description: "Authoritative query transaction ID" },
            { name: "Query Name", value: "katalyst.dev", byteRange: [54, 68], description: "Domain query" },
          ],
        },
      ],
    },
    {
      stepIndex: 4,
      timeMs: 62,
      fromNodeId: "auth-dns",
      toNodeId: "resolver",
      protocolName: "DNS",
      arrowLabel: "Authoritative Answer: A = 76.76.21.21",
      summary: "Authoritative server returns authoritative answer (AA=1) stating 'katalyst.dev' points to IPv4 76.76.21.21 with TTL 300.",
      status: "normal",
      rawHex: "525400123456005056d4e5f608004500004c5c4d400035115801d043dede080808080035c5000038a1b23a8e84000001000100000000086b6174616c797374036465760000010001c00c000100010000012c00044c4c1515",
      layers: [
        {
          name: "Domain Name System (Answer)",
          layer: "application",
          fields: [
            { name: "Transaction ID", value: "0x3a8e", byteRange: [42, 44], description: "Matches auth query transaction ID" },
            { name: "Flags", value: "0x8400 (Response, Authoritative Answer)", byteRange: [44, 46], description: "AA flag is 1, confirming this nameserver has direct authority" },
            { name: "Answer Records", value: "1", byteRange: [46, 48], description: "One A record returned" },
            { name: "TTL", value: "300 seconds", byteRange: [68, 72], description: "Time-to-live for resolver caching" },
            { name: "Resolved IP", value: "76.76.21.21", byteRange: [74, 78], description: "Target server IPv4 address" },
          ],
        },
      ],
    },
    {
      stepIndex: 5,
      timeMs: 70,
      fromNodeId: "resolver",
      toNodeId: "client",
      protocolName: "DNS",
      arrowLabel: "Standard query response A 76.76.21.21",
      summary: "Recursive resolver forwards the resolved IPv4 address 76.76.21.21 back to the client stub resolver with matching Transaction ID 0x1a2b.",
      status: "normal",
      rawHex: "001a2b3c4d5e52540012345608004500004c6d5e40003f1147f008080808c0a801690035c4120038b3c41a2b81800001000100000000086b6174616c797374036465760000010001c00c000100010000012c00044c4c1515",
      layers: [
        {
          name: "Internet Protocol Version 4",
          layer: "network",
          fields: [
            { name: "Source IP", value: "8.8.8.8", byteRange: [26, 30], description: "Resolver IP" },
            { name: "Destination IP", value: "192.168.1.105", byteRange: [30, 34], description: "Client IP" },
          ],
        },
        {
          name: "Domain Name System (Response)",
          layer: "application",
          fields: [
            { name: "Transaction ID", value: "0x1a2b", byteRange: [42, 44], description: "Original client query transaction ID" },
            { name: "Flags", value: "0x8180 (Response, Recursion Available)", byteRange: [44, 46], description: "RA flag is 1, confirming resolver did recursion" },
            { name: "Resolved IP Address", value: "76.76.21.21", byteRange: [74, 78], description: "IPv4 address delivered to client browser" },
          ],
        },
      ],
    },
  ],
  chaosVariants: [
    {
      id: "drop-query",
      name: "Packet Loss & Timeout Retransmit",
      description: "Drop the first UDP query packet between client and resolver to observe client retransmission timer.",
      triggerStepIndex: 0,
      action: "drop_packet",
      alternateSteps: [
        {
          stepIndex: 0,
          timeMs: 0,
          fromNodeId: "client",
          toNodeId: "resolver",
          protocolName: "DNS",
          arrowLabel: "Standard query 0x1a2b (DROPPED)",
          summary: "Initial UDP query packet is dropped in transit due to network packet loss. UDP has no native retransmission.",
          status: "dropped",
          rawHex: "525400123456001a2b3c4d5e0800450000381c2d40004011721ac0a8016908080808c41200350024812f1a2b01000001000000000000086b6174616c797374036465760000010001",
          layers: [
            {
              name: "Domain Name System (Lost)",
              layer: "application",
              fields: [
                { name: "Status", value: "DROPPED (Timeout timer started)", byteRange: [42, 46], description: "Client stub resolver waits 2000ms for response" },
              ],
            },
          ],
        },
        {
          stepIndex: 1,
          timeMs: 2000,
          fromNodeId: "client",
          toNodeId: "resolver",
          protocolName: "DNS",
          arrowLabel: "Retransmitted query 0x1a2b A katalyst.dev",
          summary: "Client application-level DNS resolver times out after 2000ms and retransmits the query with identical Transaction ID 0x1a2b.",
          status: "retransmission",
          rawHex: "525400123456001a2b3c4d5e0800450000381c2e400040117219c0a8016908080808c41200350024812f1a2b01000001000000000000086b6174616c797374036465760000010001",
          layers: [
            {
              name: "Domain Name System (Retransmit)",
              layer: "application",
              fields: [
                { name: "Transaction ID", value: "0x1a2b (Retransmitted)", byteRange: [42, 44], description: "Matches original query ID" },
                { name: "Retransmit Attempt", value: "#1 (after 2000ms timeout)", byteRange: [44, 46], description: "Application layer retry" },
              ],
            },
          ],
        },
      ],
    },
  ],
  examChallenge: {
    id: "dns-order-challenge",
    title: "Order the Recursive DNS Exchange",
    prompt: "A client wants to resolve 'katalyst.dev'. Arrange the steps of the recursive lookup in the correct sequential order from initial client query to final resolved IP.",
    shuffledStepIds: [3, 0, 5, 1, 4, 2],
    correctSequence: [0, 1, 2, 3, 4, 5],
    hints: [
      "The client talks to the recursive resolver before any root server is contacted.",
      "Root servers never hold authoritative records; they return referrals to TLD registry nameservers.",
      "The final answer comes from the authoritative server ns1.katalyst.dev before the resolver replies to the client.",
    ],
    explanation: "Recursive resolution flow: 1) Client -> Resolver, 2) Resolver -> Root, 3) Root referral -> Resolver, 4) Resolver -> Authoritative NS, 5) Authoritative Answer -> Resolver, 6) Resolver -> Client.",
  },
  codeSnippetBridge: {
    language: "python",
    title: "Python DNS Socket Resolver",
    code: `# Resolve DNS record using low-level socket API
import socket

domain = "katalyst.dev"
try:
    ip_address = socket.gethostbyname(domain)
    print(f"Successfully resolved {domain} -> {ip_address}")
except socket.gaierror as e:
    print(f"DNS Resolution failed: {e}")
`,
  },
};
