declare var $: any;
declare var jQuery: any;

interface JQuery {
  DataTable(options?: any): JQuery;
}

interface JQueryStatic {
  fn: {
    DataTable: {
      isDataTable(selector: any): boolean;
    };
  };
}

