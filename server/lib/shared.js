export interface ILogger {
  info(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
}

export interface MetricClient {
  value(name: string, value: number): void;
  increment(name: string, value: number): void;
}

export interface ListResult {
  has_more: boolean;
  total_results?: number;
  data: any[];
}

export interface IUserUpdateEnvelope {
  message: Object,
  currentCloseLead? : Object;
  currentCloseContact?: Object;
  skipReason?: string;
}

export interface IFilterResult {
  toInsert: Array<IUserUpdateEnvelope>;
  toUpdate: Array<IUserUpdateEnvelope>;
  toSkip: Array<IUserUpdateEnvelope>;
}

export interface IFilterUtil {
  filterAccounts(envelopes: Array<IUserUpdateEnvelope>): IFilterResult;
  filterUsers(envelopes: Array<IUserUpdateEnvelope>): IFilterResult;
}
