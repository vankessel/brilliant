export function clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(number, max));
}

export function mod(a: number, b: number) {
    let res = a % b;
    if (res < 0) {
        res += b;
    }
    return res;
}