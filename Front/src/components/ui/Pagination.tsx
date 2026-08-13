import { Button } from "./Button";

interface PaginationProps {
  pagina: number;
  temProximaPagina: boolean;
  onPaginaAnterior: () => void;
  onProximaPagina: () => void;
}

/**
 * A API não retorna contagem total de registros — só dá pra saber se existe
 * próxima página pedindo um item a mais do que o tamanho da página e
 * verificando se ele veio. Por isso não há "Página 3 de 10", só Anterior/Próxima.
 */
export function Pagination({ pagina, temProximaPagina, onPaginaAnterior, onProximaPagina }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <Button
        type="button"
        variant="secondary"
        onClick={onPaginaAnterior}
        disabled={pagina <= 1}
      >
        Anterior
      </Button>
      <span className="text-sm text-muted">Página {pagina}</span>
      <Button
        type="button"
        variant="secondary"
        onClick={onProximaPagina}
        disabled={!temProximaPagina}
      >
        Próxima
      </Button>
    </div>
  );
}
