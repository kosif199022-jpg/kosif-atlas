# sap-api-policy

Evidence-based assessment of whether an SAP API/interface usage scenario aligns with the SAP API Policy (v.4.2026a). Use whenever someone asks whether a way of calling SAP is allowed/compliant — e.g. Published API vs internal/private/"confidential" API status, "Documented Use", whether a third-party tool / iPaaS / middleware / RPA bot / AI agent / MCP server may call SAP APIs, agentic or generative-AI access to SAP, bulk data extraction or replication into a lake/warehouse, custom Z/Y OData or RFC/BAPI wrappers and Clean Core, ADT/developer-tooling boundaries, ODP-RFC and other "not permitted" interfaces, partner Integration Certification, or RISE integration remediation. Trigger even when the policy is not named, e.g. "are we allowed to…", "is it compliant to…", "can we connect X to SAP…", "will this break under the new API policy". Produces a sourced technical assessment with a confidence level — explicitly NOT legal advice and NOT a final SAP compliance decision.

- License: **GPL-3.0**
- Source: https://github.com/secondsky/sap-skills/tree/ba8a2a27c0351bdd5b508ddbc95447ca0e2644df/plugins/sap-api-policy
- Commit: `ba8a2a27c0351bdd5b508ddbc95447ca0e2644df`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0)

Unofficial copy for reference. All rights remain with the original authors under the license above.
