/**
 * @desc 工具库
 */
class Util {
    /**
     * @desc get random id
     * @param {number} randomLength
     */
    getRandomID(randomLength = 8) {
        return Number(
            Math.random()
                .toString()
                .substr(3, randomLength || 8) + Date.now()
        ).toString(36);
    }

    /**
     * 生成随机数字
     * @param {number} min 最小值（包含）
     * @param {number} max 最大值（不包含）
     */
    randomNumber(min = 0, max = 100) {
        return Math.min(Math.floor(min + Math.random() * (max - min)), max);
    }
}

export default new Util();
