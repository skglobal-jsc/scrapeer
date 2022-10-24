export interface CellResult {
  index: number;
  cols: string[];
}

export interface TableResult {
  caption?: string;
  totalRows: number;
  totalCols: number;
  titles?: string[];
  rows: CellResult[];
}
