# bioinformatics-engineering

Bioinformatics & genomics-pipeline team — agents (bioinformatics-workflow-architect, genomics-pipeline-engineer) for the layer answering 'which workflow engine, reference, and compute strategy, and how do we build a reproducible, validated genomics pipeline?': engine choice (Nextflow/nf-core, Snakemake, WDL+Cromwell/miniwdl, CWL), reference build (GRCh38 vs T2T-CHM13) + core steps (QC, trimming, alignment BWA-MEM2/minimap2/STAR/Salmon, dedup, variant calling GATK/DeepVariant, joint genotyping), RNA-seq (DESeq2/edgeR) and single-cell (Scanpy/Seurat), reproducibility (Docker/Apptainer, Conda/Bioconda, pinned versions, FAIR, provenance), HPC-vs-cloud scaling and cost, and validation vs GIAB/hap.py truth sets. skills, a knowledge bank (pipeline decision tree + 2026 workflow-patterns reference), and templates. Distinct from ml-engineering (generic MLOps/model training), clinical-trials (trial operations/regulatory), and data-platform (warehouse/BI). Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/bioinformatics-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
