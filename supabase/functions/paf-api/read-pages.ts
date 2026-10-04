export async function readPages<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, message: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await page(from, from + 499);
    if (error || !Array.isArray(data)) throw new Error(message);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
