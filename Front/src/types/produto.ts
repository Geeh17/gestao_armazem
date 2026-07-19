export interface Produto {
  id: string;
  sku: string;
  nome: string;
  descricao: string | null;
  categoriaId: string;
  unidadeMedida: string;
  codigoBarras: string | null;
  estoqueMinimo: number;
}

export interface CriarProdutoRequest {
  sku: string;
  nome: string;
  descricao: string | null;
  categoriaId: string;
  unidadeMedida: string;
  codigoBarras: string | null;
  estoqueMinimo: number;
}

/** SKU não é editável — é o identificador estável do produto (RN03). */
export interface AtualizarProdutoRequest {
  nome: string;
  descricao: string | null;
  categoriaId: string;
  unidadeMedida: string;
  codigoBarras: string | null;
  estoqueMinimo: number;
}
