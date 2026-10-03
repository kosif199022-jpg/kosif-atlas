# network-engineering

Network-engineering team — agents (network-architect, network-operations-engineer) for the ENTERPRISE network layer below the cloud VPC: campus/datacenter/WAN topology, routing (OSPF/BGP/EIGRP/static) and switching (VLANs, STP, LACP, VXLAN/EVPN), IP addressing/IPAM and DNS/DHCP, segmentation + zero-trust network access (microsegmentation, NAC, SASE/SD-WAN), load balancing, redundancy/HA (HSRP/VRRP, dual-homing), and day-2 ops (change windows, troubleshooting the OSI stack, observability/NetFlow). Knowledge bank with Mermaid decision trees (topology, routing-protocol selection, segmentation) + a dated 2026 capability map, skills, best-practices, templates, an advisory hook (any/any rules, telnet, no change window). Design-before-config; protocol-before-vendor-CLI. Seams: cloud VPC networking -> aws/azure/gcp-cloud; service mesh / k8s networking -> cloud-native-kubernetes; security verdicts -> security-engineering; IaC for network config -> terraform-iac. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/network-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
