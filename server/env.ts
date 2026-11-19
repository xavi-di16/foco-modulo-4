export function requireEnv(name: string) {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Falta la variable ${name}.`);
    return value;
}

export function errorIdentifier(error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
        return error.code;
    }
    return error instanceof Error ? error.name : 'unknown';
}
