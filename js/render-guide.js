export function renderGuide({ openEmergency }) {
  return `
    <section class="card hero">
      <h2>Guide</h2>
      <p class="muted">A field reference for the training logic, safety rules and troubleshooting.</p>
      <button class="amber" data-action="emergency">Tennis-ball emergency</button>
    </section>

    ${section("Kit", [
      "Pea-less whistle for two short pips.",
      "5–10 m biothane long line.",
      "Y-front harness; do not attach the long line to a collar.",
      "Dental-safe balls: two identical safe balls for the two-ball game.",
      "High-value food: kangaroo treats, chicken, cheese or equivalent."
    ])}

    ${section("Reward hierarchy", [
      "S: a thrown safe ball plus jackpot food.",
      "A: a wide scatter of high-value treats.",
      "B: one high-value treat.",
      "Free and powerful: release back to sniff, play or explore."
    ])}

    ${section("Golden rules", [
      "Two short sessions per day, around five minutes each.",
      "Progress only when he is around 80%+ successful.",
      "Never repeat the whistle. One pip-pip only.",
      "Every whistle pays.",
      "No rehearsed failure: use the long line when a blow-off could happen.",
      "Recall should not mean fun is over. Use many pay-and-release recalls."
    ])}

    ${section("Safety", [
      "This plan assumes possession, not aggression.",
      "If you see growling, stiffening, hard staring or snapping around resources, do not grab, chase or corner him.",
      "For genuine resource guarding, work with a qualified force-free behaviourist."
    ])}

    ${section("Troubleshooting", [
      "Won’t come off a sniff: increase distance, raise reward, and use Premack.",
      "Comes slowly: run away as he comes, use restrained recalls, and pay with movement.",
      "Drop falls apart when aroused: lower arousal and rebuild.",
      "Whistle stopped working: check whether it has started predicting leaving; rebalance with pay-and-release.",
      "Great at home, useless at park: normal. New places partially reset difficulty."
    ])}

    ${section("Maintenance", [
      "Pay for life, but vary the reward so it stays exciting.",
      "Keep the whistle sacred: it should only predict good things.",
      "Keep the tennis ball banned and the safe ball special.",
      "Refresh the long line when moving to a genuinely new or harder location."
    ])}
  `;
}

function section(title, items) {
  return `<details open><summary>${title}</summary><ul>${items.map(item => `<li>${item}</li>`).join("")}</ul></details>`;
}
