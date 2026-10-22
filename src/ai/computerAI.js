/**
 * Strategic, Realistic AI for Kolom Khelbi
 * Mimics human pen-fight tactics:
 * - Edge detection & tactical push direction
 * - Off-center spin hits for maximum knockout torque
 * - Controlled, natural power scaling
 */

const DIFFICULTY_CONFIG = {
    easy: {
        maxAngleNoise: 0.28,
        powerNoise: 0.22,
        spinHitProbability: 0.25,
        tacticalAim: false,
    },
    medium: {
        maxAngleNoise: 0.10,
        powerNoise: 0.08,
        spinHitProbability: 0.70,
        tacticalAim: true,
    },
    hard: {
        maxAngleNoise: 0.02,
        powerNoise: 0.03,
        spinHitProbability: 0.95,
        tacticalAim: true,
    },
    expert: {
        maxAngleNoise: 0.01,
        powerNoise: 0.02,
        spinHitProbability: 0.99,
        tacticalAim: true,
        powerBoost: 1.1,
    },
}

export function computeAIShot({ attackerPos, targetPos, difficulty = 'medium' }) {
    // Retrieve difficulty configuration
    const config = DIFFICULTY_CONFIG[difficulty?.toLowerCase()] || DIFFICULTY_CONFIG.medium;

    // 1. Compute base target point with tactical considerations
    let targetX = targetPos[0];
    let targetZ = targetPos[2];

    // Edge-aware push: if opponent is near an edge, aim to push them further off
    if (config.tacticalAim) {
        if (targetX < -0.5) targetX -= 0.07; // push left
        if (targetX > 0.5) targetX += 0.07; // push right
        if (targetZ < -0.3) targetZ -= 0.07; // push back
        if (targetZ > 0.3) targetZ += 0.07; // push forward
    }

    // Spin hit chance: aim slightly off-center to induce spin
    let spinOffsetX = 0;
    let spinOffsetZ = 0;
    if (config.spinHitProbability > 0 && Math.random() < config.spinHitProbability) {
        // Randomly decide spin direction
        const spinDir = Math.random() < 0.5 ? -1 : 1;
        spinOffsetX = 0.04 * spinDir;
        spinOffsetZ = 0.04 * (spinDir * -1);
    }
    targetX += spinOffsetX;
    targetZ += spinOffsetZ;

    // 2. Direction vector towards the calculated target
    const dx = targetX - attackerPos[0];
    const dz = targetZ - attackerPos[2];
    const distance = Math.hypot(dx, dz) || 0.001;
    let dirX = dx / distance;
    let dirZ = dz / distance;

    // 3. Apply difficulty based angular noise
    const angleNoise = (Math.random() * 2 - 1) * config.maxAngleNoise;
    const cosA = Math.cos(angleNoise);
    const sinA = Math.sin(angleNoise);
    const rotatedX = dirX * cosA - dirZ * sinA;
    const rotatedZ = dirX * sinA + dirZ * cosA;
    dirX = rotatedX;
    dirZ = rotatedZ;

    // 4. Base power calibrated to distance, clamped for realism
    let basePower = Math.min(Math.max(distance / 1.35, 0.35), 0.88);

    // 5. Apply difficulty based power noise
    const powerNoise = (Math.random() * 2 - 1) * config.powerNoise;
    let power = basePower * (1 + powerNoise);

    // 6. Hard difficulty adds a subtle extra impulse to simulate aggressive play
    if (difficulty?.toLowerCase() === 'hard') {
        power = Math.min(power * 1.07, 0.95);
    }

    // 7. Clamp final power within safe range
    power = Math.min(Math.max(power, 0.20), 0.95);

    // 8. Return computed shot vector and power
    return { dirX, dirZ, power };
}

