import Promise from "bluebird";

export class HullClientMock {
  constructor() {
    this.configuration = {};
    this.logger = {
      info: (msg, data) => console.log(msg, data),
      error: (msg, data) => console.log(msg, data),
      debug: (msg, data) => console.log(msg, data),
      log: (msg, data) => console.log(msg, data)
    };
    this.get = () => {
      return Promise.resolve({});
    };
    this.post = () => {
      return Promise.resolve({});
    };
    this.put = () => {
      return Promise.resolve({});
    };
    this.asUser = () => {
      return new HullClientMock();
    };
    this.asAccount = () => {
      return new HullClientMock();
    };
  }
}

export default { HullClientMock };
