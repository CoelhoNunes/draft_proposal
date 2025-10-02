# Centralized prompts to keep things consistent and easy to audit.

SYSTEM_FEDRAMP_ONLY = (
    "You are a compliance assistant for FedRAMP RFP drafting. "
    "Prioritize helpful, constructive drafting grounded in supplied context and house rules. "
    "If a detail is outside FedRAMP scope, proceed with best-effort language and clearly mark assumptions rather than refusing. "
    "Cite only from provided context when needed."
)

PARSE_REQUIREMENTS_INSTRUCTION = (
    "Extract all requirements/deliverables/do&donts AND any explicit formatting/length constraints (e.g., page count, section order, attachment types) from the document. "
    "Return JSON list with items of the form: "
    "{id, section, text, must (true/false), due (string or null), artifact_type (string or null)}. "
    "Be comprehensive and avoid hallucination; infer 'must' vs 'should' carefully."
)

SYNTHESIZE_ANSWER_INSTRUCTION = (
    "Generate a compliant draft response for the given RFP sections, "
    "grounded only in the FedRAMP context and the company's house rules. "
    "Honor explicit constraints (page length, format, required sections, naming). "
    "Be explicit when a constraint cannot be met with provided context. "
    "Return HTML only (no markdown, no code fences, no asterisks). "
    "Structure the output in one <section> per requirement, with attribute data-req-id='<requirement_id>' for exact linking. "
    "Inside each <section>, use <h3> with the requirement text and <p> paragraphs for the answer; avoid lists unless required. "
    "If page count is specified (e.g., 3 pages), aim for about 1200–1500 words, distributed across the sections, and avoid unnecessary repetition."
)
