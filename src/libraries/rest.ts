export class sendResponse {
  success: boolean = true;
  message: string = "Success getting data";
  data: any = null;
  pagination: any = {};
  error: {
    error_code: string;
    error_data: string;
  };
  constructor(
    data: Object,
    message: string = "Success getting data",
    pagination: any = {},
    status: number = 200
  ) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.pagination = pagination;
    this.error = {
      error_code: "",
      error_data: "",
    };
  }
}

export class sendError {
  success: boolean = false;
  data: String | null;
  error: {
    error_code: string | "PROCESS_ERROR";
    error_data: string | Array<any>;
  };
  message: string = "Success getting data";
  pagination: any = {};
  constructor(
    message: string,
    error_data: Array<any>,
    error_code: string = "PROCESS_ERROR",
    status: number = 400
  ) {
    this.success = false;
    this.message = message;
    this.data = null;
    this.error = {
      error_code: error_code,
      error_data: error_data,
    };
    this.pagination = {};
  }
}