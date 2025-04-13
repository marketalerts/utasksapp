export const parallel = <const T extends Array<() => unknown>>(...tasks: T) => (
    Promise.all(tasks.map(t => t()))
) as Promise<{ [i in keyof T & number]: Awaited<ReturnType<T[i]>> } & Omit<T, number>>;