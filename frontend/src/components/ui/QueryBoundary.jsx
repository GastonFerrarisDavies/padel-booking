import { ErrorState } from "./ErrorState";

/**
 * Resuelve los 3 estados obligatorios de toda vista con datos: loading / error / vacío.
 *
 * <QueryBoundary query={q} skeleton={<Skeleton/>} empty={<EmptyState/>} isEmpty={(d) => d.length === 0}>
 *   {(data) => <List items={data} />}
 * </QueryBoundary>
 */
export function QueryBoundary({ query, skeleton, empty, isEmpty = (data) => data.length === 0, children }) {
  if (query.error && query.data === undefined) return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (query.isLoading) return skeleton;
  if (query.data === undefined) return null;
  if (isEmpty(query.data)) return empty;
  return children(query.data);
}
