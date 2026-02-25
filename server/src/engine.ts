export class GameEngine {
    /**
     * Calculates the overall Combat Power based on character stats
     */
    static calculateCombatPower(str: number, dex: number, sta: number, wis: number, hpCurrent: number, hpMax: number): number {
        const hpRatio = hpMax > 0 ? hpCurrent / hpMax : 0;
        return Math.floor(((str * 1.5) + (dex * 1.2)) * (1 + wis / 100) + (sta * hpRatio));
    }

    /**
     * Calculates XP required to reach the next level
     */
    static calculateRequiredXp(currentLevel: number): number {
        return Math.floor(100 * Math.pow(currentLevel, 2.2));
    }

    /**
     * Calculates cost to upgrade a building based on base cost and current level
     */
    static calculateBuildingUpgradeCost(baseCost: number, currentLevel: number): number {
        return Math.floor(baseCost * Math.pow(1.15, currentLevel - 1));
    }

    /**
     * Calculates resources generated since last calculation
     */
    static calculateIdleProduction(baseRate: number, currentLevel: number, secondsElapsed: number): number {
        return Math.floor(baseRate * Math.pow(1.1, currentLevel) * secondsElapsed);
    }
}
